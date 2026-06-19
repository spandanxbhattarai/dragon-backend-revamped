import { Request, Response, NextFunction } from 'express';
import { galleryService } from './gallery.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateGalleryInput, UpdateGalleryInput } from './gallery.schema';

export const galleryController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string; isActive?: string };
      const result = await galleryService.list({
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
      const item = await galleryService.getById(requireParam(req, 'id'));
      ok(res, item);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await galleryService.create(req.body as CreateGalleryInput);
      created(res, item);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await galleryService.update(requireParam(req, 'id'), req.body as UpdateGalleryInput);
      ok(res, item);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await galleryService.remove(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
