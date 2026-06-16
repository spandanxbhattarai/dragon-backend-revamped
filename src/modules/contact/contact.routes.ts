import { Router } from 'express';
import { contactController } from './contact.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { verifyTurnstile } from '../../middlewares/turnstile.middleware';
import { createContactSchema, listContactSchema, replyContactSchema } from './contact.schema';

const router = Router();

// Public route (no auth) — protected by Cloudflare Turnstile
router.post('/', verifyTurnstile, validate(createContactSchema), contactController.create);

// Admin routes
router.get('/stats', authenticate, requireRole(['admin']), contactController.getStats as any);
router.get('/', authenticate, requireRole(['admin']), validate(listContactSchema), contactController.list as any);
router.post('/:id/reply', authenticate, requireRole(['admin']), validate(replyContactSchema), contactController.reply as any);
router.delete('/:id', authenticate, requireRole(['admin']), contactController.remove as any);

export default router;
