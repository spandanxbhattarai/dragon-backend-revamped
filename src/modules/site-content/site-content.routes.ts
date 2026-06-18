import { Router } from 'express';
import { siteContentController } from './site-content.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { keyParamSchema } from './site-content.schema';

const router = Router();

// Public reads.
router.get('/', siteContentController.list);
router.get('/:key', validate(keyParamSchema), siteContentController.getByKey);

// Admin-only writes.
router.put(
  '/:key',
  authenticate,
  requireRole(['admin']),
  validate(keyParamSchema),
  siteContentController.update as any,
);

export default router;
