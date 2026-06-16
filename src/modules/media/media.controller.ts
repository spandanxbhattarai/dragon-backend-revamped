import { Request, Response, NextFunction } from 'express';
import { mediaService } from './media.service';
import { ok, created, noContent } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import type { CreateMediaInput, ListMediaQuery } from './media.schema';

export const mediaController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as ListMediaQuery;
      const result = await mediaService.listMedia(query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const item = await mediaService.getById(id);
      ok(res, item);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input = req.body as CreateMediaInput;
      const item = await mediaService.createMedia(input, req.user!.userId);
      created(res, item);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await mediaService.deleteMedia(id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
