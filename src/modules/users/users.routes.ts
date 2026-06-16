import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  blockUserSchema,
  updateProfileSchema,
} from './users.schema';

const auth = authenticate as any;
const admin = requireRole(['admin']) as any;

const router = Router();

router.get('/', auth, admin, validate(listUsersSchema), usersController.list as any);
router.get('/teachers/about', usersController.getTeachersForAbout as any);
router.get('/:id', auth, admin, usersController.getById as any);
router.post('/', auth, admin, validate(createUserSchema), usersController.create as any);
router.put('/:id', auth, admin, validate(updateUserSchema), usersController.update as any);
router.put('/:id/verify', auth, admin, usersController.verify as any);
router.put('/:id/block', auth, admin, validate(blockUserSchema), usersController.block as any);
router.put('/:id/unlock', auth, admin, usersController.unlock as any);
router.post('/:id/reset-password', auth, admin, validate(resetPasswordSchema), usersController.resetPassword as any);
router.get('/:id/profile', auth, usersController.getProfile as any);
router.put('/:id/profile', auth, validate(updateProfileSchema), usersController.updateProfile as any);
router.put('/:id/enrollment', auth, usersController.updateEnrollment as any);

export default router;
