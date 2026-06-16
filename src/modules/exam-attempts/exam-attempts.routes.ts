import { Router } from 'express';
import { examAttemptsController } from './exam-attempts.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Validation happens inside each controller via zod. Routes wire auth/roles only.

router.post(
  '/exams/:examId/start',
  authenticate,
  examAttemptsController.startAttempt as any,
);

router.get(
  '/all',
  authenticate,
  requireRole(['admin', 'teacher']),
  examAttemptsController.listAll as any,
);

router.get('/history', authenticate, examAttemptsController.getHistory as any);

router.get(
  '/exam/:examId',
  authenticate,
  requireRole(['admin', 'teacher']),
  examAttemptsController.getExamAttempts as any,
);

router.post('/:attemptId/answer', authenticate, examAttemptsController.saveAnswer as any);
router.post('/:attemptId/flag', authenticate, examAttemptsController.flagQuestion as any);
router.post('/:attemptId/submit', authenticate, examAttemptsController.submitAttempt as any);

router.get('/:attemptId', authenticate, examAttemptsController.getAttemptDetail as any);

export default router;
