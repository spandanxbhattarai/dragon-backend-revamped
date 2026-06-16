import { Router } from 'express';
import { feedbackController } from './feedback.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { verifyTurnstile } from '../../middlewares/turnstile.middleware';
import { createFeedbackSchema, listFeedbackSchema, replyFeedbackSchema } from './feedback.schema';

const router = Router();

// Public routes (no auth)
router.get('/public', feedbackController.listPublic);
router.post('/', verifyTurnstile, validate(createFeedbackSchema), feedbackController.create);

// Admin routes
router.get('/stats', authenticate, requireRole(['admin']), feedbackController.getStats as any);
router.get('/', authenticate, requireRole(['admin']), validate(listFeedbackSchema), feedbackController.list as any);
router.post('/:id/reply', authenticate, requireRole(['admin']), validate(replyFeedbackSchema), feedbackController.reply as any);
router.delete('/:id', authenticate, requireRole(['admin']), feedbackController.remove as any);

export default router;
