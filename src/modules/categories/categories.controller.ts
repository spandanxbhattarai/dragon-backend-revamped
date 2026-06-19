import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export const categoriesController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as { page?: string; limit?: string };
      const result = await categoriesService.list({
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
      });
      ok(res, result.data, (result as { meta?: unknown }).meta as never);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoriesService.getById(requireParam(req, 'id'));
      ok(res, category);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoriesService.create(req.body as CreateCategoryInput);
      created(res, category);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoriesService.update(
        requireParam(req, 'id'),
        req.body as UpdateCategoryInput,
      );
      ok(res, category);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await categoriesService.remove(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
