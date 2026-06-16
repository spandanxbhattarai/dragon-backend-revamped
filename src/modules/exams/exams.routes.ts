import { Router } from 'express';
import { examsController } from './exams.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { listExamsSchema, createExamSchema, updateExamSchema } from './exams.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(listExamsSchema),
  examsController.list as any,
);

router.get('/:id', authenticate, examsController.getById as any);

router.post(
  '/',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(createExamSchema),
  examsController.create as any,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  validate(updateExamSchema),
  examsController.update as any,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  examsController.remove as any,
);

export default router;
