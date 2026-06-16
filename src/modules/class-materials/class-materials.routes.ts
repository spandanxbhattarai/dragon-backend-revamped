import { Router } from 'express';
import { classMaterialsController } from './class-materials.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();

// Validation runs inside each controller via zod. Routes wire auth/roles only.
router.get('/', authenticate, classMaterialsController.list as any);

// More specific paths must be registered before /:id

// Inline signed view URL (image/video stream directly from S3).
router.get('/:id/view-url', authenticate, classMaterialsController.viewUrl as any);

// Same-origin byte proxy (PDFs) so pdf.js can fetch without an S3 CORS rule.
router.get('/:id/stream', authenticate, classMaterialsController.stream as any);

// Attachment download is staff-only — students are view-only.
router.get(
  '/:id/download',
  authenticate,
  requireRole(['admin', 'teacher']),
  classMaterialsController.download as any,
);
router.get('/:id', authenticate, classMaterialsController.getById as any);

router.post(
  '/',
  authenticate,
  requireRole(['admin', 'teacher']),
  classMaterialsController.create as any,
);

router.put(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  classMaterialsController.update as any,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  classMaterialsController.remove as any,
);

export default router;
