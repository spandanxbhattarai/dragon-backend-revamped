import { Router } from 'express';
import { homeVideosController } from './home-videos.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createHomeVideoSchema,
  updateHomeVideoSchema,
  listHomeVideosSchema,
} from './home-videos.schema';

const router = Router();

router.get('/', validate(listHomeVideosSchema), homeVideosController.list);
router.get('/:id', homeVideosController.getById);
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createHomeVideoSchema),
  homeVideosController.create as any,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateHomeVideoSchema),
  homeVideosController.update as any,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateHomeVideoSchema),
  homeVideosController.update as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  homeVideosController.remove as any,
);

export default router;
