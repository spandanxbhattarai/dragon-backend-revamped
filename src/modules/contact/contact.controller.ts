import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateContactInput, ReplyContactInput } from './contact.schema';

export const contactController = {
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateContactInput;
      const entry = await contactService.createMessage(input);
      created(res, entry);
    } catch (err) {
      next(err);
    }
  },

  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as {
        page?: string;
        limit?: string;
        status?: 'pending' | 'replied';
        search?: string;
      };
      const result = await contactService.listMessages({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        status: query.status,
        search: query.search,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  reply: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      const { reply } = req.body as ReplyContactInput;
      const entry = await contactService.replyMessage(id, reply);
      ok(res, entry);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = requireParam(req, 'id');
      await contactService.deleteMessage(id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  getStats: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await contactService.getStats();
      ok(res, stats);
    } catch (err) {
      next(err);
    }
  },
};
