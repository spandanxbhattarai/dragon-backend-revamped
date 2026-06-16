import { db } from '../../../db';
import { questionOptions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { examAttemptsRepository } from '../exam-attempts.repository';
import { examsRepository } from '../../exams/exams.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../lib/errors';
import { submitAttemptService } from './submit-attempt.service';

async function assertActiveAttempt(userId: string, attemptId: string) {
  const attempt = await examAttemptsRepository.findAttemptById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.userId !== userId) throw new ForbiddenError('You do not own this attempt');
  if (attempt.status !== 'in_progress') {
    throw new BadRequestError('This attempt is no longer active');
  }
  return attempt;
}

async function assertExamInWindow(userId: string, examId: string, attemptId: string) {
  const exam = await examsRepository.findById(examId);
  if (!exam) throw new NotFoundError('Exam not found');

  const now = new Date();
  if (exam.endDateTime < now) {
    await submitAttemptService.submit(userId, attemptId);
    throw new BadRequestError('Exam time has expired — your attempt has been auto-submitted');
  }
  if (exam.startDateTime > now) {
    throw new BadRequestError('This exam has not started yet');
  }
  return exam;
}

export const saveAnswerService = {
  save: async (
    userId: string,
    attemptId: string,
    questionId: string,
    selectedOptionId: string | null,
  ) => {
    const attempt = await assertActiveAttempt(userId, attemptId);
    await assertExamInWindow(userId, attempt.examId, attemptId);

    // Resolve correctness server-side. Client never sees this until submit.
    let isCorrect = false;
    if (selectedOptionId) {
      const result = await db
        .select({ isCorrect: questionOptions.isCorrect })
        .from(questionOptions)
        .where(eq(questionOptions.id, selectedOptionId))
        .limit(1);
      isCorrect = result[0]?.isCorrect ?? false;
    }

    const saved = await examAttemptsRepository.saveAnswer(
      attemptId,
      questionId,
      selectedOptionId,
      isCorrect,
    );

    // Strip isCorrect from the response — client should not learn answer key.
    return {
      attemptId: saved.attemptId,
      questionId: saved.questionId,
      selectedOptionId: saved.selectedOptionId,
      isFlagged: saved.isFlagged,
      answeredAt: saved.answeredAt,
    };
  },

  flag: async (
    userId: string,
    attemptId: string,
    questionId: string,
    isFlagged: boolean,
  ) => {
    const attempt = await assertActiveAttempt(userId, attemptId);
    await assertExamInWindow(userId, attempt.examId, attemptId);

    const saved = await examAttemptsRepository.flagQuestion(attemptId, questionId, isFlagged);
    return {
      attemptId: saved.attemptId,
      questionId: saved.questionId,
      isFlagged: saved.isFlagged,
    };
  },
};
