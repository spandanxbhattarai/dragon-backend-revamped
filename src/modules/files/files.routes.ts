import { Router } from 'express';
import { filesController, multerUpload } from './files.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post(
  '/upload',
  authenticate,
  multerUpload.single('file'),
  filesController.uploadFile as any,
);

export default router;
