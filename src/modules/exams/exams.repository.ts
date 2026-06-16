import { db } from '../../db';
import { exams, examAttempts, questionSheets, questions, studentProfiles } from '../../db/schema';
import { eq, and, or, ilike, desc, count, sql, isNull, gt, gte, lt, lte, notInArray } from 'drizzle-orm';

interface Pagination {
  offset: number;
  limit: number;
}

interface ExamFilters {
  search?: string;
  plan?: string;
  // Lifecycle status computed from the exam's [start, end] window vs. now.
  status?: 'upcoming' | 'active' | 'ended';
  enrolledCourseId?: string;
  // When set, only exams whose [startDateTime, endDateTime] window covers
  // this instant are returned. Used to hide upcoming/ended exams from
  // students.
  activeAt?: Date;
  // When set, exams the user has already submitted are excluded. Keeps
  // the active list from re-offering completed exams.
  excludeSubmittedByUserId?: string;
}

type NewExamData = Omit<typeof exams.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateExamData = Partial<Omit<typeof exams.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>;

export const examsRepository = {
  generateExamCode: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'EX-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  findAll: async (filters: ExamFilters, pagination: Pagination) => {
    const conditions = [];
    if (filters.search) conditions.push(ilike(exams.title, `%${filters.search}%`));
    if (filters.plan) conditions.push(sql`${filters.plan} = ANY(${exams.accessPlans})`);

    // Lifecycle status filter — derived from the exam window vs. the current time.
    if (filters.status) {
      const now = new Date();
      if (filters.status === 'upcoming') {
        conditions.push(gt(exams.startDateTime, now));
      } else if (filters.status === 'active') {
        conditions.push(lte(exams.startDateTime, now));
        conditions.push(gte(exams.endDateTime, now));
      } else if (filters.status === 'ended') {
        conditions.push(lt(exams.endDateTime, now));
      }
    }

    // Course-scope: exam.courseId is either null (available to anyone the
    // plan filter allows) or must match the student's enrollment.
    if (filters.enrolledCourseId) {
      const scope = or(isNull(exams.courseId), eq(exams.courseId, filters.enrolledCourseId));
      if (scope) conditions.push(scope);
    }

    // Time window: only currently-running exams for student callers.
    if (filters.activeAt) {
      conditions.push(lte(exams.startDateTime, filters.activeAt));
      conditions.push(gte(exams.endDateTime, filters.activeAt));
    }

    // Skip exams the student has already submitted.
    if (filters.excludeSubmittedByUserId) {
      const subq = db
        .select({ id: examAttempts.examId })
        .from(examAttempts)
        .where(
          and(
            eq(examAttempts.userId, filters.excludeSubmittedByUserId),
            eq(examAttempts.status, 'submitted'),
          ),
        );
      conditions.push(notInArray(exams.id, subq));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: exams.id,
        examCode: exams.examCode,
        title: exams.title,
        description: exams.description,
        startDateTime: exams.startDateTime,
        endDateTime: exams.endDateTime,
        totalMarks: exams.totalMarks,
        passMarks: exams.passMarks,
        durationMinutes: exams.durationMinutes,
        negativeMarking: exams.negativeMarking,
        negativeMarkingValue: exams.negativeMarkingValue,
        questionSheetId: exams.questionSheetId,
        courseId: exams.courseId,
        accessPlans: exams.accessPlans,
        createdBy: exams.createdBy,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
        questionSheetTitle: questionSheets.sheetName,
      })
      .from(exams)
      .leftJoin(questionSheets, eq(questionSheets.id, exams.questionSheetId));

    const [rows, totalResult] = await Promise.all([
      whereClause
        ? baseQuery.where(whereClause).orderBy(desc(exams.createdAt)).offset(pagination.offset).limit(pagination.limit)
        : baseQuery.orderBy(desc(exams.createdAt)).offset(pagination.offset).limit(pagination.limit),
      whereClause
        ? db.select({ count: count() }).from(exams).where(whereClause)
        : db.select({ count: count() }).from(exams),
    ]);

    const data = rows.map(({ questionSheetTitle, ...exam }) => ({
      ...exam,
      questionSheet: questionSheetTitle ? { id: exam.questionSheetId, title: questionSheetTitle } : null,
    }));

    return { data, total: totalResult[0]?.count ?? 0 };
  },

  // Attempt counts for the exam-detail statistics panel. Grouped by status in
  // a single query so totals/submitted/in-progress stay consistent.
  getAttemptCounts: async (examId: string) => {
    const rows = await db
      .select({ status: examAttempts.status, count: count() })
      .from(examAttempts)
      .where(eq(examAttempts.examId, examId))
      .groupBy(examAttempts.status);

    let attempts = 0;
    let submittedAttempts = 0;
    let inProgressAttempts = 0;
    for (const r of rows) {
      const c = Number(r.count);
      attempts += c;
      if (r.status === 'submitted') submittedAttempts += c;
      else if (r.status === 'in_progress') inProgressAttempts += c;
    }
    return { attempts, submittedAttempts, inProgressAttempts };
  },

  findById: async (id: string) => {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    if (!exam) return null;

    const [sheet] = await db
      .select({
        id: questionSheets.id,
        title: questionSheets.sheetName,
        totalQuestions: count(questions.id),
      })
      .from(questionSheets)
      .leftJoin(questions, eq(questions.sheetId, questionSheets.id))
      .where(eq(questionSheets.id, exam.questionSheetId))
      .groupBy(questionSheets.id);

    return { ...exam, questionSheet: sheet ?? null };
  },

  create: async (examData: NewExamData) => {
    const [newExam] = await db.insert(exams).values(examData).returning();
    return newExam;
  },

  update: async (id: string, examData: UpdateExamData) => {
    const [updated] = await db
      .update(exams)
      .set({ ...examData, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return updated;
  },

  remove: async (id: string) => {
    await db.delete(exams).where(eq(exams.id, id));
  },

  // Sum of question.marks for a sheet. Coerced to number because the
  // marks column is numeric() and drizzle returns it as a string.
  sumSheetMarks: async (sheetId: string): Promise<number> => {
    const [row] = await db
      .select({ total: sql<string>`COALESCE(SUM(${questions.marks}), 0)` })
      .from(questions)
      .where(eq(questions.sheetId, sheetId));
    return Number(row?.total ?? 0);
  },

  findStudentPlan: async (userId: string): Promise<string | null> => {
    const [row] = await db
      .select({ plan: studentProfiles.plan })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    return row?.plan ?? null;
  },

  findStudentCourseId: async (userId: string): Promise<string | null> => {
    const [row] = await db
      .select({ courseId: studentProfiles.courseId })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    return row?.courseId ?? null;
  },
};
