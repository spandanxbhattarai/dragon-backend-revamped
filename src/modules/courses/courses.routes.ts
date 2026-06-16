import { Router } from 'express';
import { coursesController } from './courses.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCourseSchema, updateCourseSchema, listCoursesSchema } from './courses.schema';

const router = Router();

// Public routes (active courses only, trending first)
router.get('/', validate(listCoursesSchema), coursesController.list);
router.get('/slug/:slug', coursesController.getBySlug);

// Admin routes (must be before /:id to avoid param collision)
router.get(
  '/admin/all',
  authenticate,
  requireRole(['admin']),
  validate(listCoursesSchema),
  coursesController.listAll as any,
);

router.get('/:id', coursesController.getById);

router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createCourseSchema),
  coursesController.create as any,
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateCourseSchema),
  coursesController.update as any,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  coursesController.remove as any,
);

export default router;
