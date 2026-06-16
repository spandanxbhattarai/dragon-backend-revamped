import { Router } from 'express';
import { authController, multerRegisterUpload } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { verifyTurnstile } from '../../middlewares/turnstile.middleware';
import { loginSchema, registerSchema, refreshSchema, logoutSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
// multer parses multipart -> populates req.body with text fields and
// req.files with the uploads; validation runs after the parse so the
// shared validator can still operate on req.body.
router.post('/register', multerRegisterUpload, verifyTurnstile, validate(registerSchema), authController.register);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate as any, validate(logoutSchema), authController.logout as any);
router.get('/me', authenticate as any, authController.getMe as any);

export default router;
