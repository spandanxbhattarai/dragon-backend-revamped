import { examAttemptsRepository } from '../exam-attempts.repository';
import { examsRepository } from '../../exams/exams.repository';
import { questionsRepository } from '../../questions/questions.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../lib/errors';

export const startAttemptService = {
  start: async (userId: string, examId: string) => {
    const exam = await examsRepository.findById(examId);
    if (!exam) throw new NotFoundError('Exam not found');

    // Check duplicate submission FIRST so even a slow time-window check
    // can never accidentally hand a fresh attempt to a returning student.
    const submitted = await examAttemptsRepository.findSubmittedAttempt(userId, examId);
    if (submitted) {
      return {
        alreadySubmitted: true as const,
        attemptId: submitted.id,
        exam: {
          id: exam.id,
          title: exam.title,
          totalMarks: parseFloat(String(exam.totalMarks)),
          passMarks: exam.passMarks ? parseFloat(String(exam.passMarks)) : null,
        },
      };
    }

    const now = new Date();
    if (exam.startDateTime > now) {
      throw new BadRequestError('This exam has not started yet');
    }
    if (exam.endDateTime < now) {
      throw new BadRequestError('This exam has already ended');
    }

    // Course-targeted exams: caller must be enrolled in that course.
    if (exam.courseId) {
      const studentCourseId = await examsRepository.findStudentCourseId(userId);
      if (studentCourseId !== exam.courseId) {
        throw new ForbiddenError('This exam is restricted to students of a different course');
      }
    }

    let attempt: Awaited<ReturnType<typeof examAttemptsRepository.createAttempt>>;
    const existingAnswers: Record<string, string> = {};
    const flaggedQuestions: string[] = [];

    const inProgress = await examAttemptsRepository.findOpenAttempt(userId, examId);
    if (inProgress) {
      attempt = inProgress;
      const saved = await examAttemptsRepository.findAnswersByAttempt(inProgress.id);
      for (const a of saved) {
        if (a.selectedOptionId) existingAnswers[a.questionId] = a.selectedOptionId;
        if (a.isFlagged) flaggedQuestions.push(a.questionId);
      }
    } else {
      // Re-check submitted right before insert to close the tiny race where
      // a parallel submit could race with start.
      const racedSubmit = await examAttemptsRepository.findSubmittedAttempt(userId, examId);
      if (racedSubmit) {
        return {
          alreadySubmitted: true as const,
          attemptId: racedSubmit.id,
          exam: {
            id: exam.id,
            title: exam.title,
            totalMarks: parseFloat(String(exam.totalMarks)),
            passMarks: exam.passMarks ? parseFloat(String(exam.passMarks)) : null,
          },
        };
      }
      attempt = await examAttemptsRepository.createAttempt(userId, examId);
    }

    const sheet = await questionsRepository.findSheetById(exam.questionSheetId);

    // Strip isCorrect from options — never expose answer key to client mid-exam
    const safeQuestions = (sheet?.questions ?? []).map(q => ({
      id: q.id,
      questionText: q.questionText,
      marks: parseFloat(String(q.marks)) || 0,
      order: q.sortOrder,
      sortOrder: q.sortOrder,
      options: q.options.map(o => ({
        id: o.id,
        optionText: o.optionText,
        order: o.sortOrder,
        sortOrder: o.sortOrder,
      })),
    }));

    return {
      alreadySubmitted: false as const,
      attemptId: attempt.id,
      attempt,
      exam: {
        id: exam.id,
        title: exam.title,
        endDateTime: exam.endDateTime,
        startDateTime: exam.startDateTime,
        durationMinutes: exam.durationMinutes,
        totalMarks: parseFloat(String(exam.totalMarks)),
        passMarks: parseFloat(String(exam.passMarks ?? 0)),
        negativeMarking: exam.negativeMarking,
        negativeMarkingValue: exam.negativeMarkingValue
          ? parseFloat(String(exam.negativeMarkingValue))
          : undefined,
      },
      questions: safeQuestions,
      existingAnswers,
      flaggedQuestions,
    };
  },
};
