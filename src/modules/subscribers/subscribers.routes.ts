import { Router } from 'express';
import { subscribersController } from './subscribers.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { verifyTurnstile } from '../../middlewares/turnstile.middleware';
import { subscribeSchema, listSubscribersSchema, broadcastSchema } from './subscribers.schema';

const router = Router();

router.post('/', verifyTurnstile, validate(subscribeSchema), subscribersController.subscribe);
router.post(
  '/broadcast',
  authenticate,
  requireRole(['admin']),
  validate(broadcastSchema),
  subscribersController.broadcast as any,
);
router.get(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(listSubscribersSchema),
  subscribersController.list as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  subscribersController.unsubscribe as any,
);

export default router;
