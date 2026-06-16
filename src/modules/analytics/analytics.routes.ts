import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { heartbeatSchema, pageviewSchema, dailyStatsSchema } from './analytics.schema';

const router = Router();

router.post(
  '/heartbeat',
  authenticate,
  validate(heartbeatSchema),
  analyticsController.heartbeat as any,
);

router.post(
  '/pageview',
  validate(pageviewSchema),
  analyticsController.recordPageview,
);

router.get(
  '/active-now',
  authenticate,
  requireRole(['admin']),
  analyticsController.getActiveNow as any,
);

router.get(
  '/daily',
  authenticate,
  requireRole(['admin']),
  validate(dailyStatsSchema),
  analyticsController.getDailyStats as any,
);

router.get(
  '/summary',
  authenticate,
  requireRole(['admin']),
  analyticsController.getDashboardSummary as any,
);

export default router;
