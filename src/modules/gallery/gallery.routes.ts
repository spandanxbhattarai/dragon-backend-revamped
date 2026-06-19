import { Router } from 'express';
import { galleryController } from './gallery.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createGallerySchema,
  updateGallerySchema,
  listGallerySchema,
} from './gallery.schema';

const router = Router();

router.get('/', validate(listGallerySchema), galleryController.list);
router.get('/:id', galleryController.getById);
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createGallerySchema),
  galleryController.create as any,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateGallerySchema),
  galleryController.update as any,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateGallerySchema),
  galleryController.update as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  galleryController.remove as any,
);

export default router;
