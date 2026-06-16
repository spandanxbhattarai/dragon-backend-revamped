import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { leaderboardSchema } from './leaderboard.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(leaderboardSchema),
  leaderboardController.getLeaderboard as any,
);

export default router;
