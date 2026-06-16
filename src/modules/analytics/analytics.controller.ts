import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { ok } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const analyticsController = {
  heartbeat: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { sessionToken, pagePath } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await analyticsService.heartbeat(
        userId,
        sessionToken,
        pagePath,
        ipAddress,
        userAgent,
      );
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  recordPageview: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionToken, pagePath, utmSource } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        ?? req.socket.remoteAddress;
      const result = await analyticsService.recordPageview(
        sessionToken,
        pagePath,
        utmSource,
        ipAddress,
      );
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getActiveNow: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await analyticsService.getActiveNow();
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getDailyStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const result = await analyticsService.getDailyStats({ from, to });
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getDashboardSummary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await analyticsService.getDashboardSummary();
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },
};
