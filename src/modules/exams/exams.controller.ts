import { Response, NextFunction } from 'express';
import { examsService } from './exams.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const examsController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, status } = req.query as {
        page?: string;
        limit?: string;
        search?: string;
        status?: 'upcoming' | 'active' | 'ended';
      };
      const result = await examsService.listExams(
        {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          search,
          status,
        },
        req.user,
      );
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const exam = await examsService.getExamById(requireParam(req, 'id'));
      ok(res, exam);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const exam = await examsService.createExam(req.body, userId);
      created(res, exam);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const exam = await examsService.updateExam(requireParam(req, 'id'), req.body);
      ok(res, exam);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await examsService.deleteExam(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },
};
