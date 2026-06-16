import { Request, Response, NextFunction } from 'express';
import { subscribersService } from './subscribers.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { SubscribeInput, BroadcastInput } from './subscribers.schema';

export const subscribersController = {
  subscribe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as SubscribeInput;
      const subscriber = await subscribersService.subscribe(input);
      created(res, subscriber);
    } catch (err) {
      next(err);
    }
  },

  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string };
      const result = await subscribersService.listSubscribers({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  unsubscribe: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      await subscribersService.unsubscribe(id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  broadcast: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as BroadcastInput;
      const result = await subscribersService.broadcast(input);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },
};
