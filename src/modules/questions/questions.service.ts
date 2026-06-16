import { db } from '../../db';
import { questions as questionsTable, questionOptions as questionOptionsTable } from '../../db/schema';
import { questionsRepository } from './questions.repository';
import { paginate, paginationMeta } from '../../utils/paginate';
import { NotFoundError } from '../../lib/errors';
import {
  CreateSheetInput,
  UpdateSheetInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  ImportQuestionsInput,
  ReorderQuestionsInput,
} from './questions.schema';

const addQuestionWithOptions = async (
  sheetId: string,
  questionText: string,
  marks: number,
  sortOrder: number,
  options: Array<{ optionText: string; isCorrect: boolean; sortOrder: number }>,
) => {
  return await db.transaction(async tx => {
    const [newQuestion] = await tx
      .insert(questionsTable)
      .values({ sheetId, questionText, marks: String(marks), sortOrder })
      .returning();

    const opts = await tx
      .insert(questionOptionsTable)
      .values(
        options.map(opt => ({
          questionId: newQuestion.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          sortOrder: opt.sortOrder,
        })),
      )
      .returning();

    return { ...newQuestion, options: opts };
  });
};

export const questionsService = {
  createSheet: async (input: CreateSheetInput, userId?: string) => {
    return await questionsRepository.createSheet({
      sheetName: input.title,
      createdBy: userId,
    });
  },

  updateSheet: async (id: string, input: UpdateSheetInput) => {
    const existing = await questionsRepository.findSheetById(id);
    if (!existing) throw new NotFoundError('Question sheet not found');
    return await questionsRepository.updateSheet(id, { sheetName: input.title });
  },

  listSheets: async (query: { page: number; limit: number; search?: string }) => {
    const { page, limit, search } = query;
    const { offset } = paginate({ page, limit });

    const { data, total } = await questionsRepository.findAllSheets(
      { search },
      { offset, limit },
    );

    return {
      data,
      meta: paginationMeta(total, page, limit),
    };
  },

  getSheetById: async (id: string) => {
    const sheet = await questionsRepository.findSheetById(id);
    if (!sheet) throw new NotFoundError('Question sheet not found');
    return sheet;
  },

  addQuestion: async (sheetId: string, input: CreateQuestionInput) => {
    const sheet = await questionsRepository.findSheetById(sheetId);
    if (!sheet) throw new NotFoundError('Question sheet not found');

    return await addQuestionWithOptions(
      sheetId,
      input.questionText,
      input.marks,
      input.sortOrder,
      input.options.map((o, i) => ({
        optionText: o.optionText,
        isCorrect: o.isCorrect,
        sortOrder: o.sortOrder ?? i,
      })),
    );
  },

  updateQuestion: async (
    sheetId: string,
    questionId: string,
    input: UpdateQuestionInput,
  ) => {
    const sheet = await questionsRepository.findSheetById(sheetId);
    if (!sheet) throw new NotFoundError('Question sheet not found');

    const question = await questionsRepository.findQuestionById(questionId);
    if (!question || question.sheetId !== sheetId) {
      throw new NotFoundError('Question not found in this sheet');
    }

    await questionsRepository.updateQuestion(questionId, {
      questionText: input.questionText,
      marks: input.marks,
      sortOrder: input.sortOrder,
    });

    if (input.options) {
      await questionsRepository.replaceOptions(
        questionId,
        input.options.map((o, i) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          sortOrder: o.sortOrder ?? i,
        })),
      );
    }

    return await questionsRepository.findQuestionById(questionId);
  },

  deleteQuestion: async (sheetId: string, questionId: string) => {
    const sheet = await questionsRepository.findSheetById(sheetId);
    if (!sheet) throw new NotFoundError('Question sheet not found');

    const question = await questionsRepository.findQuestionById(questionId);
    if (!question || question.sheetId !== sheetId) {
      throw new NotFoundError('Question not found in this sheet');
    }

    await questionsRepository.deleteQuestion(questionId);
  },

  importQuestions: async (sheetId: string, input: ImportQuestionsInput) => {
    const sheet = await questionsRepository.findSheetById(sheetId);
    if (!sheet) throw new NotFoundError('Question sheet not found');

    return await questionsRepository.bulkAddQuestions(
      sheetId,
      input.questions.map(q => ({
        questionText: q.questionText,
        marks: q.marks,
        options: q.options,
      })),
    );
  },

  deleteSheet: async (id: string) => {
    const sheet = await questionsRepository.findSheetById(id);
    if (!sheet) throw new NotFoundError('Question sheet not found');
    await questionsRepository.deleteSheet(id);
  },

  reorderQuestions: async (sheetId: string, input: ReorderQuestionsInput) => {
    const sheet = await questionsRepository.findSheetById(sheetId);
    if (!sheet) throw new NotFoundError('Question sheet not found');
    await questionsRepository.reorderQuestions(input.orders);
    return { ok: true };
  },
};
