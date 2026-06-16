import { Router } from 'express';
import { questionsController } from './questions.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  listSheetsSchema,
  createSheetSchema,
  updateSheetSchema,
  createQuestionSchema,
  updateQuestionSchema,
  importQuestionsSchema,
  reorderQuestionsSchema,
} from './questions.schema';

const router = Router();

// Question sheets are answer-key material. Only admin/teacher can browse
// them directly. Students never call these endpoints — the exam-attempt
// flow strips answers and returns a safe view of the questions.
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(listSheetsSchema),
  questionsController.listSheets as any,
);

router.post(
  '/',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(createSheetSchema),
  questionsController.createSheet as any,
);

router.get(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  questionsController.getSheetById as any,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(updateSheetSchema),
  questionsController.updateSheet as any,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  questionsController.deleteSheet as any,
);

router.post(
  '/:id/questions',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(createQuestionSchema),
  questionsController.addQuestion as any,
);

router.put(
  '/:id/questions/:qId',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(updateQuestionSchema),
  questionsController.updateQuestion as any,
);

router.delete(
  '/:id/questions/:qId',
  authenticate,
  requireRole(['admin', 'teacher']),
  questionsController.deleteQuestion as any,
);

router.post(
  '/:id/import',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(importQuestionsSchema),
  questionsController.importQuestions as any,
);

router.patch(
  '/:id/questions/reorder',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(reorderQuestionsSchema),
  questionsController.reorderQuestions as any,
);

export default router;
