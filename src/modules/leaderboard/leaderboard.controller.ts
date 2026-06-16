import { Response, NextFunction } from 'express';
import { leaderboardService } from './leaderboard.service';
import { ok } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const leaderboardController = {
  getLeaderboard: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { examId, courseId, from, to, page, limit } = req.query as {
        examId?: string;
        courseId?: string;
        from?: string;
        to?: string;
        page?: string;
        limit?: string;
      };
      const result = await leaderboardService.getLeaderboard({
        examId,
        courseId,
        from,
        to,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },
};
