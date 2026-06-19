import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesSchema,
} from './categories.schema';

const router = Router();

// Public
router.get('/', validate(listCategoriesSchema), categoriesController.list);
router.get('/:id', categoriesController.getById);

// Admin
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validate(createCategorySchema),
  categoriesController.create as any,
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['admin']),
  validate(updateCategorySchema),
  categoriesController.update as any,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  categoriesController.remove as any,
);

export default router;
