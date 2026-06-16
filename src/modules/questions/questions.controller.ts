import { Response, NextFunction } from 'express';
import { questionsService } from './questions.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const questionsController = {
  listSheets: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
      };
      const result = await questionsService.listSheets({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
      });
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getSheetById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sheet = await questionsService.getSheetById(requireParam(req, 'id'));
      ok(res, sheet);
    } catch (err) {
      next(err);
    }
  },

  createSheet: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const sheet = await questionsService.createSheet(req.body, userId);
      created(res, sheet);
    } catch (err) {
      next(err);
    }
  },

  updateSheet: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sheet = await questionsService.updateSheet(requireParam(req, 'id'), req.body);
      ok(res, sheet);
    } catch (err) {
      next(err);
    }
  },

  deleteSheet: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await questionsService.deleteSheet(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  addQuestion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const question = await questionsService.addQuestion(requireParam(req, 'id'), req.body);
      created(res, question);
    } catch (err) {
      next(err);
    }
  },

  updateQuestion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const question = await questionsService.updateQuestion(
        requireParam(req, 'id'),
        requireParam(req, 'qId'),
        req.body,
      );
      ok(res, question);
    } catch (err) {
      next(err);
    }
  },

  deleteQuestion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await questionsService.deleteQuestion(requireParam(req, 'id'), requireParam(req, 'qId'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  importQuestions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await questionsService.importQuestions(requireParam(req, 'id'), req.body);
      created(res, result);
    } catch (err) {
      next(err);
    }
  },

  reorderQuestions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await questionsService.reorderQuestions(requireParam(req, 'id'), req.body);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },
};
