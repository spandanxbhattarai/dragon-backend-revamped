import { Response, NextFunction } from 'express';
import { eventsService } from './events.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateEventInput, UpdateEventInput } from './events.schema';

export const eventsController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as {
        page?: string;
        limit?: string;
        privacy?: string;
        search?: string;
      };
      const result = await eventsService.list(
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 10,
          privacy: query.privacy,
          search: query.search,
        },
        req.user,
      );
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await eventsService.getById(requireParam(req, 'id'), req.user);
      ok(res, event);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateEventInput;
      const event = await eventsService.create(input);
      created(res, event);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as UpdateEventInput;
      const event = await eventsService.update(requireParam(req, 'id'), input);
      ok(res, event);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await eventsService.remove(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
