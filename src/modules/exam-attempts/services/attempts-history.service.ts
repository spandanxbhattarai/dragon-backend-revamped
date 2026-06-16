import { examAttemptsRepository } from '../exam-attempts.repository';
import { paginate, paginationMeta } from '../../../utils/paginate';
import { NotFoundError, ForbiddenError } from '../../../lib/errors';

type RawOption = { id: string; questionId: string; optionText: string; isCorrect: boolean; sortOrder: number };
type RawQuestion = {
  id: string;
  questionText: string;
  marks: unknown;
  sortOrder: number;
  options: RawOption[];
  userAnswer: { selectedOptionId: string | null; isCorrect: boolean | null; isFlagged: boolean } | null;
};

// Hide the answer key when the attempt isn't submitted yet.
function sanitizeDetail(detail: any, allowAnswerKey: boolean) {
  const questions = (detail.questions as RawQuestion[]).map(q => ({
    ...q,
    options: q.options.map(o => ({
      id: o.id,
      questionId: o.questionId,
      optionText: o.optionText,
      sortOrder: o.sortOrder,
      ...(allowAnswerKey ? { isCorrect: o.isCorrect } : {}),
    })),
    userAnswer: q.userAnswer
      ? {
          selectedOptionId: q.userAnswer.selectedOptionId,
          isFlagged: q.userAnswer.isFlagged,
          ...(allowAnswerKey ? { isCorrect: q.userAnswer.isCorrect } : {}),
        }
      : null,
  }));
  return { ...detail, questions };
}

export const attemptsHistoryService = {
  getHistory: async (
    userId: string,
    query: { page: number; limit: number; examId?: string; search?: string; from?: string; to?: string },
  ) => {
    const { page, limit, examId, search, from, to } = query;
    const { offset } = paginate({ page, limit });
    const { data, total } = await examAttemptsRepository.findHistory(
      userId,
      { examId, search, from, to },
      { offset, limit },
    );
    const enriched = data.map(a => {
      const passMarks = a.examPassMarks ? parseFloat(String(a.examPassMarks)) : null;
      const obtained = a.marksObtained ? parseFloat(String(a.marksObtained)) : null;
      const result =
        a.status === 'submitted' && passMarks !== null && obtained !== null
          ? obtained >= passMarks ? 'pass' : 'fail'
          : null;
      return { ...a, result };
    });
    return { data: enriched, meta: paginationMeta(total, page, limit) };
  },

  getAttemptDetail: async (userId: string, attemptId: string, userRole: string) => {
    const detailed = await examAttemptsRepository.findDetailedAttempt(attemptId);
    if (!detailed) throw new NotFoundError('Attempt not found');

    const isOwner = detailed.userId === userId;
    const isPrivileged = userRole === 'admin' || userRole === 'teacher';
    if (!isPrivileged && !isOwner) {
      throw new ForbiddenError('You do not have access to this attempt');
    }

    // Answer key visible only after submission (admins/teachers always see it).
    const allowAnswerKey = isPrivileged || detailed.status === 'submitted';
    return sanitizeDetail(detailed, allowAnswerKey);
  },

  getExamAttempts: async (
    examId: string,
    query: { page: number; limit: number; search?: string },
  ) => {
    const { page, limit, search } = query;
    const { offset } = paginate({ page, limit });
    const { data, total } = await examAttemptsRepository.findAttemptsByExam(
      examId,
      { offset, limit },
      search,
    );
    return { data, meta: paginationMeta(total, page, limit) };
  },

  listAllAttempts: async (query: {
    page: number;
    limit: number;
    search?: string;
    from?: string;
    to?: string;
  }) => {
    const { page, limit, search, from, to } = query;
    const { offset } = paginate({ page, limit });
    const { data, total } = await examAttemptsRepository.findAllAttempts(
      { offset, limit },
      { search, from, to },
    );
    return { data, meta: paginationMeta(total, page, limit) };
  },
};
