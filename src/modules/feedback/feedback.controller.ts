import { Request, Response, NextFunction } from 'express';
import { feedbackService } from './feedback.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateFeedbackInput, ReplyFeedbackInput } from './feedback.schema';

export const feedbackController = {
  listPublic: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await feedbackService.listPublicFeedback();
      ok(res, data);
    } catch (err) {
      next(err);
    }
  },

  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string; rating?: string };
      const result = await feedbackService.listFeedback({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        rating: query.rating !== undefined ? Number(query.rating) : undefined,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateFeedbackInput;
      const entry = await feedbackService.createFeedback(input);
      created(res, entry);
    } catch (err) {
      next(err);
    }
  },

  reply: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      const { reply } = req.body as ReplyFeedbackInput;
      const entry = await feedbackService.replyFeedback(id, reply);
      ok(res, entry);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      await feedbackService.deleteFeedback(id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await feedbackService.getStats();
      ok(res, stats);
    } catch (err) {
      next(err);
    }
  },
};
