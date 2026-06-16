import { Response, NextFunction } from 'express';
import { examAttemptsService } from './exam-attempts.service';
import { ok, created } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  startAttemptSchema,
  saveAnswerSchema,
  flagQuestionSchema,
  submitAttemptSchema,
  listHistorySchema,
  attemptIdParamSchema,
  examIdParamSchema,
  paginationQuerySchema,
} from './exam-attempts.schema';

export const examAttemptsController = {
  startAttempt: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params } = startAttemptSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const result = await examAttemptsService.startAttempt(userId, params.examId);
      created(res, result);
    } catch (err) {
      next(err);
    }
  },

  saveAnswer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params, body } = saveAnswerSchema.parse({ params: req.params, body: req.body });
      const userId = req.user!.userId;
      const result = await examAttemptsService.saveAnswer(
        userId,
        params.attemptId,
        body.questionId,
        body.selectedOptionId,
      );
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  flagQuestion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params, body } = flagQuestionSchema.parse({ params: req.params, body: req.body });
      const userId = req.user!.userId;
      const result = await examAttemptsService.flagQuestion(
        userId,
        params.attemptId,
        body.questionId,
        body.isFlagged,
      );
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  submitAttempt: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params } = submitAttemptSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const result = await examAttemptsService.submitAttempt(userId, params.attemptId);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { query } = listHistorySchema.parse({ query: req.query });
      const userId = req.user!.userId;
      const result = await examAttemptsService.getHistory(userId, query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getAttemptDetail: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params } = attemptIdParamSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await examAttemptsService.getAttemptDetail(userId, params.attemptId, userRole);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getExamAttempts: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { params } = examIdParamSchema.parse({ params: req.params });
      const { query } = paginationQuerySchema.parse({ query: req.query });
      const result = await examAttemptsService.getExamAttempts(params.examId, query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  listAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { query } = paginationQuerySchema.parse({ query: req.query });
      const result = await examAttemptsService.listAllAttempts(query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },
};
