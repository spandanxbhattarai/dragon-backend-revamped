import { Request, Response, NextFunction } from 'express';
import { advertisementsService } from './advertisements.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateAdInput, UpdateAdInput } from './advertisements.schema';

export const advertisementsController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string; isActive?: string };
      const result = await advertisementsService.listAds({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        isActive: query.isActive,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      const ad = await advertisementsService.getAdById(id);
      ok(res, ad);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateAdInput;
      const ad = await advertisementsService.createAd(input);
      created(res, ad);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      const input = req.body as UpdateAdInput;
      const ad = await advertisementsService.updateAd(id, input);
      ok(res, ad);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      await advertisementsService.deleteAd(id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
