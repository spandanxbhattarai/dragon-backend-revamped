import { Response, NextFunction } from 'express';
import { announcementsService } from './announcements.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './announcements.schema';

export const announcementsController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        privacy?: string;
      };
      const result = await announcementsService.list(
        {
          page: Number(query.page) || 1,
          limit: Number(query.limit) || 10,
          search: query.search,
          privacy: query.privacy,
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
      const announcement = await announcementsService.getById(
        requireParam(req, 'id'),
        req.user,
      );
      ok(res, announcement);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateAnnouncementInput;
      const announcement = await announcementsService.create(input);
      created(res, announcement);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as UpdateAnnouncementInput;
      const announcement = await announcementsService.update(requireParam(req, 'id'), input);
      ok(res, announcement);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await announcementsService.remove(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
