import { db } from '../../db';
import { questionSheets, questions, questionOptions, users } from '../../db/schema';
import { eq, and, ilike, desc, asc, count, sql } from 'drizzle-orm';

interface Pagination {
  offset: number;
  limit: number;
}

interface SheetFilters {
  search?: string;
}

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface BulkQuestionInput {
  questionText: string;
  marks: number;
  options: Array<{ optionText: string; isCorrect: boolean }>;
}

export const questionsRepository = {
  findAllSheets: async (filters: SheetFilters, pagination: Pagination) => {
    const conditions = [];
    if (filters.search) {
      conditions.push(ilike(questionSheets.sheetName, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: questionSheets.id,
          title: questionSheets.sheetName,
          createdById: questionSheets.createdBy,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          createdAt: questionSheets.createdAt,
          updatedAt: questionSheets.updatedAt,
          totalQuestions: count(questions.id),
          totalMarks: sql<string>`COALESCE(SUM(${questions.marks}::numeric), 0)`,
        })
        .from(questionSheets)
        .leftJoin(questions, eq(questions.sheetId, questionSheets.id))
        .leftJoin(users, eq(users.id, questionSheets.createdBy))
        .where(whereClause)
        .groupBy(questionSheets.id, users.id)
        .orderBy(desc(questionSheets.createdAt))
        .offset(pagination.offset)
        .limit(pagination.limit),
      db.select({ count: count() }).from(questionSheets).where(whereClause),
    ]);

    return {
      // Reshape createdBy into the { firstName, lastName } object the client
      // expects — it was previously the raw user id, which rendered as
      // "undefined undefined".
      data: data.map(({ createdById, creatorFirstName, creatorLastName, ...rest }) => ({
        ...rest,
        createdBy: creatorFirstName
          ? { firstName: creatorFirstName, lastName: creatorLastName ?? '' }
          : null,
      })),
      total: totalResult[0]?.count ?? 0,
    };
  },

  findSheetById: async (id: string) => {
    const sheet = await db
      .select()
      .from(questionSheets)
      .where(eq(questionSheets.id, id))
      .limit(1);

    if (!sheet[0]) return null;

    const sheetQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.sheetId, id))
      .orderBy(asc(questions.sortOrder));

    const questionIds = sheetQuestions.map(q => q.id);
    const options =
      questionIds.length > 0
        ? await db
            .select()
            .from(questionOptions)
            .where(
              sql`${questionOptions.questionId} = ANY(${sql.raw(`ARRAY[${questionIds.map(id => `'${id}'`).join(',')}]::uuid[]`)})`,
            )
            .orderBy(asc(questionOptions.sortOrder))
        : [];

    const optionsByQuestion = options.reduce<Record<string, typeof options>>(
      (acc, opt) => {
        if (!acc[opt.questionId]) acc[opt.questionId] = [];
        acc[opt.questionId].push(opt);
        return acc;
      },
      {},
    );

    const { sheetName, ...sheetRest } = sheet[0];
    const totalMarks = sheetQuestions.reduce((sum, q) => sum + (parseFloat(String(q.marks)) || 0), 0);

    return {
      ...sheetRest,
      title: sheetName,
      totalQuestions: sheetQuestions.length,
      totalMarks,
      questions: sheetQuestions.map(q => ({
        ...q,
        options: optionsByQuestion[q.id] ?? [],
      })),
    };
  },

  createSheet: async (data: { sheetName: string; createdBy?: string }) => {
    const result = await db
      .insert(questionSheets)
      .values({
        sheetName: data.sheetName,
        createdBy: data.createdBy ?? null,
      })
      .returning();
    const { sheetName, ...rest } = result[0];
    return { ...rest, title: sheetName };
  },

  updateSheet: async (id: string, data: { sheetName: string }) => {
    const result = await db
      .update(questionSheets)
      .set({ sheetName: data.sheetName, updatedAt: new Date() })
      .where(eq(questionSheets.id, id))
      .returning();
    if (!result[0]) return null;
    const { sheetName, ...rest } = result[0];
    return { ...rest, title: sheetName };
  },

  deleteSheet: async (id: string) => {
    await db.delete(questionSheets).where(eq(questionSheets.id, id));
  },

  addQuestion: async (
    sheetId: string,
    questionText: string,
    marks: number,
    sortOrder: number,
  ) => {
    const result = await db
      .insert(questions)
      .values({ sheetId, questionText, marks: String(marks), sortOrder })
      .returning();
    return result[0];
  },

  addOptions: async (questionId: string, options: OptionInput[]) => {
    if (options.length === 0) return [];
    const result = await db
      .insert(questionOptions)
      .values(
        options.map(opt => ({
          questionId,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          sortOrder: opt.sortOrder,
        })),
      )
      .returning();
    return result;
  },

  findQuestionById: async (id: string) => {
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question[0]) return null;

    const opts = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, id))
      .orderBy(asc(questionOptions.sortOrder));

    return { ...question[0], options: opts };
  },

  updateQuestion: async (
    id: string,
    data: { questionText?: string; marks?: number; sortOrder?: number },
  ) => {
    const updateData: Record<string, unknown> = {};
    if (data.questionText !== undefined) updateData.questionText = data.questionText;
    if (data.marks !== undefined) updateData.marks = String(data.marks);
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const result = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, id))
      .returning();
    return result[0] ?? null;
  },

  replaceOptions: async (questionId: string, options: OptionInput[]) => {
    return await db.transaction(async tx => {
      await tx.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
      if (options.length === 0) return [];
      const result = await tx
        .insert(questionOptions)
        .values(
          options.map(opt => ({
            questionId,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder,
          })),
        )
        .returning();
      return result;
    });
  },

  deleteQuestion: async (id: string) => {
    await db.delete(questions).where(eq(questions.id, id));
  },

  reorderQuestions: async (orders: { id: string; sortOrder: number }[]) => {
    await db.transaction(async tx => {
      for (const { id, sortOrder } of orders) {
        await tx.update(questions).set({ sortOrder }).where(eq(questions.id, id));
      }
    });
  },

  bulkAddQuestions: async (sheetId: string, bulkQuestions: BulkQuestionInput[]) => {
    return await db.transaction(async tx => {
      const inserted = [];
      for (const q of bulkQuestions) {
        const [newQuestion] = await tx
          .insert(questions)
          .values({
            sheetId,
            questionText: q.questionText,
            marks: String(q.marks),
            sortOrder: 0,
          })
          .returning();

        const opts = await tx
          .insert(questionOptions)
          .values(
            q.options.map((opt, idx) => ({
              questionId: newQuestion.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              sortOrder: idx,
            })),
          )
          .returning();

        inserted.push({ ...newQuestion, options: opts });
      }
      return inserted;
    });
  },
};
