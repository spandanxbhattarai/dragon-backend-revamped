import { Router } from 'express';
import { chatbotController } from './chatbot.controller';
import { validate } from '../../middlewares/validate.middleware';
import { rateLimit } from '../../middlewares/rate-limit.middleware';
import { messageSchema } from './chatbot.schema';

const router = Router();

// Public route (no auth). Rate limited per IP because each message costs an
// LLM call. 20 messages / 5 minutes / IP.
router.post(
  '/message',
  rateLimit({ windowMs: 5 * 60 * 1000, max: 20 }),
  validate(messageSchema),
  chatbotController.message,
);

export default router;
