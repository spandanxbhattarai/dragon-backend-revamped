import { leaderboardRepository } from './leaderboard.repository';
import { paginate, paginationMeta } from '../../utils/paginate';

type Medal = 'gold' | 'silver' | 'bronze' | null;

const getMedal = (rank: number): Medal => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return null;
};

export const leaderboardService = {
  getLeaderboard: async (query: {
    examId?: string;
    courseId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) => {
    const { page, limit, examId, courseId, from, to } = query;
    const { offset } = paginate({ page, limit });

    const { data, total } = await leaderboardRepository.getLeaderboard(
      { examId, courseId, from, to },
      { offset, limit },
    );

    const enriched = data.map(entry => ({
      rank: Number(entry.rank),
      medal: getMedal(Number(entry.rank)),
      userId: entry.user_id,
      firstName: entry.first_name,
      lastName: entry.last_name,
      examId: entry.exam_id,
      examTitle: entry.exam_title,
      score: parseFloat(String(entry.score)),
      totalMarks: parseFloat(String(entry.total_marks)),
      percentage: parseFloat(String(entry.percentage)),
      timeTakenSeconds: entry.time_taken_seconds,
      submittedAt: entry.submitted_at,
      status: entry.status,
    }));

    return {
      data: enriched,
      meta: paginationMeta(total, page, limit),
    };
  },
};
