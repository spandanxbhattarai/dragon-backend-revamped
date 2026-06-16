import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsSchema,
} from './announcements.schema';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validate(listAnnouncementsSchema),
  announcementsController.list as any,
);
router.get('/:id', optionalAuthenticate, announcementsController.getById as any);
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createAnnouncementSchema),
  announcementsController.create as any,
);
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateAnnouncementSchema),
  announcementsController.update as any,
);
router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  announcementsController.remove as any,
);

export default router;
