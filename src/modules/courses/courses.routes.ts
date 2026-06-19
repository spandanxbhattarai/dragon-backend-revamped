import { Router } from 'express';
import { coursesController } from './courses.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCourseSchema, updateCourseSchema, listCoursesSchema } from './courses.schema';

const router = Router();

// Public routes (active courses only, trending first). These never expose the
// `information` field.
router.get('/', validate(listCoursesSchema), coursesController.list);
router.get('/slug/:slug', coursesController.getBySlug);

// The logged-in student's own enrolled course, including `information`.
// Must be declared before '/:id' so "me" isn't treated as an id.
router.get('/me', authenticate, coursesController.getMyCourse as any);

// Public: record a course page view (dedup handled client-side via localStorage).
router.post('/:id/view', coursesController.recordView);

// Admin analytics: courses ranked by view count.
router.get(
  '/admin/views',
  authenticate,
  requireRole(['admin']),
  coursesController.topViewed as any,
);

// Admin routes (must be before /:id to avoid param collision)
router.get(
  '/admin/all',
  authenticate,
  requireRole(['admin']),
  validate(listCoursesSchema),
  coursesController.listAll as any,
);

// Single course by id includes `information`, so it's admin-only.
router.get('/:id', authenticate, requireRole(['admin']), coursesController.getById as any);

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
