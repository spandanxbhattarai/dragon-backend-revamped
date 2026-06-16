import { Router } from 'express';
import { mediaController } from './media.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createMediaSchema, listMediaSchema } from './media.schema';

const auth = authenticate as any;
const admin = requireRole(['admin']) as any;

const router = Router();

router.get('/', auth, admin, validate(listMediaSchema), mediaController.list as any);
router.get('/:id', auth, admin, mediaController.getById as any);
router.post('/', auth, admin, validate(createMediaSchema), mediaController.create as any);
router.delete('/:id', auth, admin, mediaController.remove as any);

export default router;
