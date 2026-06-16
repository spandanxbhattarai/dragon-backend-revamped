import { Request, Response, NextFunction } from 'express';
import { homeVideosService } from './home-videos.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateHomeVideoInput, UpdateHomeVideoInput } from './home-videos.schema';

export const homeVideosController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string; isActive?: string };
      const result = await homeVideosService.list({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        isActive: query.isActive,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const v = await homeVideosService.getById(requireParam(req, 'id'));
      ok(res, v);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const v = await homeVideosService.create(req.body as CreateHomeVideoInput);
      created(res, v);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const v = await homeVideosService.update(requireParam(req, 'id'), req.body as UpdateHomeVideoInput);
      ok(res, v);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await homeVideosService.remove(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
