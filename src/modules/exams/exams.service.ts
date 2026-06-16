import { examsRepository } from './exams.repository';
import { paginate, paginationMeta } from '../../utils/paginate';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreateExamInput, UpdateExamInput } from './exams.schema';

type Requester = { userId: string; role: string } | undefined;

const computeTotalMarks = async (sheetId: string): Promise<number> => {
  const total = await examsRepository.sumSheetMarks(sheetId);
  if (total <= 0) {
    throw new BadRequestError(
      'Selected question sheet has no questions with marks — add questions before creating the exam',
    );
  }
  return total;
};

export const examsService = {
  createExam: async (input: CreateExamInput, createdBy: string) => {
    const totalMarks = await computeTotalMarks(input.questionSheetId);
    const examCode = examsRepository.generateExamCode();
    return await examsRepository.create({
      title: input.title,
      description: input.description ?? null,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      totalMarks: String(totalMarks),
      passMarks: input.passMarks ? String(input.passMarks) : null,
      durationMinutes: input.durationMinutes,
      negativeMarking: input.negativeMarking,
      negativeMarkingValue: input.negativeMarkingValue ? String(input.negativeMarkingValue) : null,
      questionSheetId: input.questionSheetId,
      courseId: input.courseId ?? null,
      accessPlans: input.accessPlans ?? ['free', 'half', 'paid'],
      examCode,
      createdBy,
    });
  },

  listExams: async (
    query: { page: number; limit: number; search?: string; status?: 'upcoming' | 'active' | 'ended' },
    requester: Requester,
  ) => {
    const { page, limit, search, status } = query;
    const { offset } = paginate({ page, limit });

    const filters: Parameters<typeof examsRepository.findAll>[0] = { search, status };

    if (requester?.role === 'student') {
      // Students see: exams whose accessPlans include their plan, that they
      // haven't already submitted, and that are course-agnostic OR match their
      // enrolled course. Upcoming and ended exams are intentionally INCLUDED —
      // students can see them, but the start-attempt service blocks actually
      // attending one outside its [start, end] window.
      const [plan, courseId] = await Promise.all([
        examsRepository.findStudentPlan(requester.userId),
        examsRepository.findStudentCourseId(requester.userId),
      ]);
      if (plan) filters.plan = plan;
      filters.excludeSubmittedByUserId = requester.userId;
      if (courseId) filters.enrolledCourseId = courseId;
      else filters.enrolledCourseId = '00000000-0000-0000-0000-000000000000';
      // Sentinel UUID matches no real course — so students without an
      // enrollment only see exams where courseId IS NULL.
    }

    const { data, total } = await examsRepository.findAll(filters, { offset, limit });
    return { data, meta: paginationMeta(total, page, limit) };
  },

  getExamById: async (id: string) => {
    const exam = await examsRepository.findById(id);
    if (!exam) throw new NotFoundError('Exam not found');
    const _count = await examsRepository.getAttemptCounts(id);
    return { ...exam, _count };
  },

  updateExam: async (id: string, input: UpdateExamInput) => {
    const existing = await examsRepository.findById(id);
    if (!existing) throw new NotFoundError('Exam not found');

    const totalMarks = input.questionSheetId
      ? await computeTotalMarks(input.questionSheetId)
      : undefined;

    return await examsRepository.update(id, {
      title: input.title,
      description: input.description,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      totalMarks: totalMarks !== undefined ? String(totalMarks) : undefined,
      passMarks: input.passMarks ? String(input.passMarks) : undefined,
      durationMinutes: input.durationMinutes,
      negativeMarking: input.negativeMarking,
      negativeMarkingValue: input.negativeMarkingValue
        ? String(input.negativeMarkingValue)
        : undefined,
      questionSheetId: input.questionSheetId,
      courseId: input.courseId,
      accessPlans: input.accessPlans,
    });
  },

  deleteExam: async (id: string) => {
    const exam = await examsRepository.findById(id);
    if (!exam) throw new NotFoundError('Exam not found');
    await examsRepository.remove(id);
  },
};
