import { Router } from 'express';
import { advertisementsController } from './advertisements.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createAdSchema, updateAdSchema, listAdsSchema } from './advertisements.schema';

const router = Router();

router.get('/', validate(listAdsSchema), advertisementsController.list);
router.get('/:id', advertisementsController.getById);
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createAdSchema),
  advertisementsController.create as any,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateAdSchema),
  advertisementsController.update as any,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateAdSchema),
  advertisementsController.update as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  advertisementsController.remove as any,
);

export default router;
