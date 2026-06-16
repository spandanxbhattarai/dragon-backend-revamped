import { examAttemptsRepository } from '../exam-attempts.repository';
import { examsRepository } from '../../exams/exams.repository';
import { questionsRepository } from '../../questions/questions.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../lib/errors';

interface Tallied {
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  positiveMarks: number;
  // Sum of the marks allotted to wrong-answered questions. Negative marking is
  // applied as a percentage of this, so each wrong answer costs a share of its
  // own question's marks rather than a flat amount.
  incorrectMarks: number;
}

function tally(
  questions: { id: string; marks: unknown }[],
  answers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean | null }[],
): Tallied {
  const map = new Map(answers.map(a => [a.questionId, a]));
  let correct = 0;
  let incorrect = 0;
  let positive = 0;
  let incorrectMarks = 0;
  for (const q of questions) {
    const a = map.get(q.id);
    const qMarks = parseFloat(String(q.marks)) || 1;
    if (a?.selectedOptionId) {
      if (a.isCorrect) {
        correct++;
        positive += qMarks;
      } else {
        incorrect++;
        incorrectMarks += qMarks;
      }
    }
  }
  const answered = answers.filter(a => a.selectedOptionId !== null).length;
  return {
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    unanswered: questions.length - answered,
    positiveMarks: positive,
    incorrectMarks,
  };
}

export const submitAttemptService = {
  submit: async (userId: string, attemptId: string) => {
    const attempt = await examAttemptsRepository.findAttemptById(attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenError('You do not own this attempt');
    if (attempt.status === 'submitted') {
      throw new ConflictError('This attempt has already been submitted');
    }

    const exam = await examsRepository.findById(attempt.examId);
    if (!exam) throw new NotFoundError('Exam not found');

    const [savedAnswers, sheet] = await Promise.all([
      examAttemptsRepository.findAnswersByAttempt(attemptId),
      questionsRepository.findSheetById(exam.questionSheetId),
    ]);
    const allQuestions = sheet?.questions ?? [];

    const tallied = tally(allQuestions, savedAnswers);

    const negMark = exam.negativeMarking ?? false;
    // negativeMarkingValue is now a PERCENTAGE: each wrong answer deducts that
    // percentage of the marks allotted to its question.
    const negPercent = parseFloat(String(exam.negativeMarkingValue)) || 0;
    const negativeDeducted = negMark ? (negPercent / 100) * tallied.incorrectMarks : 0;

    const totalMarks = parseFloat(String(exam.totalMarks)) || 0;
    const marksObtained = Math.max(0, tallied.positiveMarks - negativeDeducted);
    const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

    const submittedAt = new Date();
    const timeTakenSeconds = Math.floor(
      (submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000,
    );

    const saved = await examAttemptsRepository.submitAttempt(attemptId, {
      marksObtained,
      totalMarks,
      correctAnswers: tallied.correctAnswers,
      incorrectAnswers: tallied.incorrectAnswers,
      unanswered: tallied.unanswered,
      percentage,
      timeTakenSeconds,
      submittedAt,
    });

    const passMarks = parseFloat(String(exam.passMarks)) || null;
    const passed = passMarks !== null ? marksObtained >= passMarks : null;

    return {
      ...saved,
      score: marksObtained,
      percentage,
      totalMarks,
      timeTakenSeconds,
      wrongAnswers: tallied.incorrectAnswers,
      skippedAnswers: tallied.unanswered,
      result: passed === true ? 'pass' : passed === false ? 'fail' : null,
      passed,
      passMarks,
      correctAnswers: tallied.correctAnswers,
      incorrectAnswers: tallied.incorrectAnswers,
      unanswered: tallied.unanswered,
      totalQuestions: allQuestions.length,
    };
  },
};
