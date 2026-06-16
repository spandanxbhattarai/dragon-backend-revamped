import { db } from '../../db';
import {
  examAttempts,
  examAttemptAnswers,
  exams,
  users,
  questions,
  questionOptions,
} from '../../db/schema';
import { eq, and, or, ilike, desc, count, sql, type SQL } from 'drizzle-orm';

interface Pagination {
  offset: number;
  limit: number;
}

interface SubmitResults {
  marksObtained: number;
  totalMarks: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: Date;
}

export const examAttemptsRepository = {
  findOpenAttempt: async (userId: string, examId: string) => {
    const result = await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, userId),
          eq(examAttempts.examId, examId),
          eq(examAttempts.status, 'in_progress'),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  },

  findSubmittedAttempt: async (userId: string, examId: string) => {
    const result = await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, userId),
          eq(examAttempts.examId, examId),
          eq(examAttempts.status, 'submitted'),
        ),
      )
      .limit(1);
    return result[0] ?? null;
  },

  findAttemptById: async (id: string) => {
    const attempt = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, id))
      .limit(1);

    if (!attempt[0]) return null;

    const answers = await db
      .select()
      .from(examAttemptAnswers)
      .where(eq(examAttemptAnswers.attemptId, id));

    return { ...attempt[0], answers };
  },

  createAttempt: async (userId: string, examId: string) => {
    const [attempt] = await db
      .insert(examAttempts)
      .values({
        userId,
        examId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .returning();
    return attempt;
  },

  saveAnswer: async (
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
    isCorrect: boolean,
  ) => {
    const existing = await db
      .select()
      .from(examAttemptAnswers)
      .where(
        and(
          eq(examAttemptAnswers.attemptId, attemptId),
          eq(examAttemptAnswers.questionId, questionId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(examAttemptAnswers)
        .set({ selectedOptionId: selectedOptionId ?? null, isCorrect, answeredAt: new Date() })
        .where(
          and(
            eq(examAttemptAnswers.attemptId, attemptId),
            eq(examAttemptAnswers.questionId, questionId),
          ),
        )
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(examAttemptAnswers)
      .values({
        attemptId,
        questionId,
        selectedOptionId: selectedOptionId ?? null,
        isCorrect,
        answeredAt: new Date(),
      })
      .returning();
    return inserted;
  },

  flagQuestion: async (attemptId: string, questionId: string, isFlagged: boolean) => {
    const existing = await db
      .select()
      .from(examAttemptAnswers)
      .where(
        and(
          eq(examAttemptAnswers.attemptId, attemptId),
          eq(examAttemptAnswers.questionId, questionId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(examAttemptAnswers)
        .set({ isFlagged })
        .where(
          and(
            eq(examAttemptAnswers.attemptId, attemptId),
            eq(examAttemptAnswers.questionId, questionId),
          ),
        )
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(examAttemptAnswers)
      .values({
        attemptId,
        questionId,
        selectedOptionId: null,
        isCorrect: false,
        isFlagged,
      })
      .returning();
    return inserted;
  },

  submitAttempt: async (attemptId: string, results: SubmitResults) => {
    const [updated] = await db
      .update(examAttempts)
      .set({
        status: 'submitted',
        marksObtained: String(results.marksObtained),
        totalMarks: String(results.totalMarks),
        correctAnswers: results.correctAnswers,
        incorrectAnswers: results.incorrectAnswers,
        unanswered: results.unanswered,
        percentage: String(results.percentage),
        timeTakenSeconds: results.timeTakenSeconds,
        submittedAt: results.submittedAt,
      })
      .where(eq(examAttempts.id, attemptId))
      .returning();
    return updated;
  },

  findHistory: async (
    userId: string,
    filters: { examId?: string; search?: string; from?: string; to?: string },
    pagination: Pagination,
  ) => {
    const conditions = [eq(examAttempts.userId, userId)];
    if (filters.examId) {
      conditions.push(eq(examAttempts.examId, filters.examId));
    }
    if (filters.search) {
      conditions.push(ilike(exams.title, `%${filters.search}%`));
    }
    // Filter against the attempt date shown in the UI (submitted date, falling
    // back to when it was started for in-progress attempts).
    const dateCol = sql`coalesce(${examAttempts.submittedAt}, ${examAttempts.startedAt})`;
    if (filters.from) {
      conditions.push(sql`${dateCol} >= ${filters.from}`);
    }
    if (filters.to) {
      // Inclusive of the whole "to" day.
      conditions.push(sql`${dateCol} < (${filters.to}::date + interval '1 day')`);
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: examAttempts.id,
          examId: examAttempts.examId,
          examTitle: exams.title,
          examPassMarks: exams.passMarks,
          status: examAttempts.status,
          marksObtained: examAttempts.marksObtained,
          totalMarks: examAttempts.totalMarks,
          percentage: examAttempts.percentage,
          correctAnswers: examAttempts.correctAnswers,
          incorrectAnswers: examAttempts.incorrectAnswers,
          unanswered: examAttempts.unanswered,
          timeTakenSeconds: examAttempts.timeTakenSeconds,
          startedAt: examAttempts.startedAt,
          submittedAt: examAttempts.submittedAt,
        })
        .from(examAttempts)
        .leftJoin(exams, eq(exams.id, examAttempts.examId))
        .where(whereClause)
        .orderBy(desc(examAttempts.startedAt))
        .offset(pagination.offset)
        .limit(pagination.limit),
      // Join exams here too — the search condition references exam columns.
      db
        .select({ count: count() })
        .from(examAttempts)
        .leftJoin(exams, eq(exams.id, examAttempts.examId))
        .where(whereClause),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  },

  findAttemptsByExam: async (examId: string, pagination: Pagination, search?: string) => {
    const conditions = [eq(examAttempts.examId, examId)];
    if (search) {
      // Match against first name, last name, "first last", or email.
      const term = `%${search}%`;
      const searchCondition = or(
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term),
        ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, term),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: examAttempts.id,
          userId: examAttempts.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          status: examAttempts.status,
          marksObtained: examAttempts.marksObtained,
          totalMarks: examAttempts.totalMarks,
          percentage: examAttempts.percentage,
          correctAnswers: examAttempts.correctAnswers,
          incorrectAnswers: examAttempts.incorrectAnswers,
          unanswered: examAttempts.unanswered,
          timeTakenSeconds: examAttempts.timeTakenSeconds,
          startedAt: examAttempts.startedAt,
          submittedAt: examAttempts.submittedAt,
        })
        .from(examAttempts)
        .leftJoin(users, eq(users.id, examAttempts.userId))
        .where(whereClause)
        .orderBy(desc(examAttempts.submittedAt))
        .offset(pagination.offset)
        .limit(pagination.limit),
      // Join users here too — the search condition references user columns.
      db
        .select({ count: count() })
        .from(examAttempts)
        .leftJoin(users, eq(users.id, examAttempts.userId))
        .where(whereClause),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  },

  findDetailedAttempt: async (attemptId: string) => {
    const attempt = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, attemptId))
      .limit(1);

    if (!attempt[0]) return null;

    const answers = await db
      .select()
      .from(examAttemptAnswers)
      .where(eq(examAttemptAnswers.attemptId, attemptId));

    const exam = await db
      .select()
      .from(exams)
      .where(eq(exams.id, attempt[0].examId))
      .limit(1);

    const sheetQuestions = exam[0]
      ? await db
          .select()
          .from(questions)
          .where(eq(questions.sheetId, exam[0].questionSheetId))
      : [];

    const questionIds = sheetQuestions.map(q => q.id);
    const opts =
      questionIds.length > 0
        ? await db
            .select()
            .from(questionOptions)
            .where(
              sql`${questionOptions.questionId} = ANY(${sql.raw(`ARRAY[${questionIds.map(id => `'${id}'`).join(',')}]::uuid[]`)})`,
            )
        : [];

    const optionsByQuestion = opts.reduce<Record<string, typeof opts>>((acc, o) => {
      if (!acc[o.questionId]) acc[o.questionId] = [];
      acc[o.questionId].push(o);
      return acc;
    }, {});

    const answerMap = answers.reduce<Record<string, (typeof answers)[0]>>((acc, a) => {
      acc[a.questionId] = a;
      return acc;
    }, {});

    const questionsWithDetail = sheetQuestions.map(q => ({
      ...q,
      options: optionsByQuestion[q.id] ?? [],
      userAnswer: answerMap[q.id] ?? null,
    }));

    return {
      ...attempt[0],
      exam: exam[0] ?? null,
      questions: questionsWithDetail,
    };
  },

  findAnswersByAttempt: async (attemptId: string) => {
    return await db
      .select()
      .from(examAttemptAnswers)
      .where(eq(examAttemptAnswers.attemptId, attemptId));
  },

  findAllAttempts: async (
    pagination: Pagination,
    filters: { search?: string; from?: string; to?: string } = {},
  ) => {
    const conditions: SQL[] = [];
    if (filters.search) {
      // Match exam title, student name, "first last", or email.
      const term = `%${filters.search}%`;
      const searchCondition = or(
        ilike(exams.title, term),
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term),
        ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, term),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    const dateCol = sql`coalesce(${examAttempts.submittedAt}, ${examAttempts.startedAt})`;
    if (filters.from) {
      conditions.push(sql`${dateCol} >= ${filters.from}`);
    }
    if (filters.to) {
      conditions.push(sql`${dateCol} < (${filters.to}::date + interval '1 day')`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: examAttempts.id,
          userId: examAttempts.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          examId: examAttempts.examId,
          examTitle: exams.title,
          examPassMarks: exams.passMarks,
          status: examAttempts.status,
          marksObtained: examAttempts.marksObtained,
          totalMarks: examAttempts.totalMarks,
          percentage: examAttempts.percentage,
          timeTakenSeconds: examAttempts.timeTakenSeconds,
          startedAt: examAttempts.startedAt,
          submittedAt: examAttempts.submittedAt,
        })
        .from(examAttempts)
        .leftJoin(users, eq(users.id, examAttempts.userId))
        .leftJoin(exams, eq(exams.id, examAttempts.examId))
        .where(whereClause)
        .orderBy(desc(examAttempts.startedAt))
        .offset(pagination.offset)
        .limit(pagination.limit),
      // Join users + exams here too — the search condition references their columns.
      db
        .select({ count: count() })
        .from(examAttempts)
        .leftJoin(users, eq(users.id, examAttempts.userId))
        .leftJoin(exams, eq(exams.id, examAttempts.examId))
        .where(whereClause),
    ]);

    return { data, total: totalResult[0]?.count ?? 0 };
  },
};
