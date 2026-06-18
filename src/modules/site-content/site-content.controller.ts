import { Request, Response, NextFunction } from 'express';
import { siteContentService } from './site-content.service';
import { ok } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { SiteContentKey } from './site-content.schema';

export const siteContentController = {
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await siteContentService.getAll();
      ok(res, data);
    } catch (err) {
      next(err);
    }
  },

  getByKey: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await siteContentService.getByKey(requireParam(req, 'key') as SiteContentKey);
      ok(res, data);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await siteContentService.update(
        requireParam(req, 'key') as SiteContentKey,
        req.body,
      );
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },
};
