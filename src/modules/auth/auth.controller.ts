import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import passport from 'passport';
import { authService } from './services/auth.service';
import { tokenService } from './services/token.service';
import { ok, created } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

type AuthenticatedUser = { userId: string; role: string };
type PassportInfo = { message?: string } | undefined;

const DOC_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// Multipart parser for /auth/register. Bundles registration fields with the
// citizenship + (optional) payment receipt in a single request so the
// public upload endpoint can stay closed off and won't be abused as a
// free image host.
export const multerRegisterUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (DOC_ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP, or PDF files are allowed'));
  },
}).fields([
  { name: 'citizenship', maxCount: 1 },
  { name: 'payment', maxCount: 1 },
]);

export const authController = {
  login: (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      'local',
      { session: false },
      async (err: Error | null, user: AuthenticatedUser | false, info: PassportInfo) => {
        try {
          if (err) return next(err);
          if (!user) {
            const msg = info?.message ?? 'Invalid credentials';
            const isAccountIssue =
              msg.includes('locked') || msg.includes('blocked') || msg.includes('verified');
            return res.status(isAccountIssue ? 403 : 401).json({ success: false, message: msg });
          }
          const result = await authService.login(user);
          return ok(res, result);
        } catch (loginErr) {
          return next(loginErr);
        }
      },
    )(req, res, next);
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files ?? {}) as {
        citizenship?: Express.Multer.File[];
        payment?: Express.Multer.File[];
      };
      const user = await authService.register(req.body, {
        citizenshipFile: files.citizenship?.[0],
        paymentFile: files.payment?.[0],
      });
      return created(res, {
        user,
        message: 'Registration successful. Awaiting admin verification.',
      });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await tokenService.rotateRefreshToken(refreshToken);
      return ok(res, tokens);
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await tokenService.revokeOne(refreshToken);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      return ok(res, { user });
    } catch (err) {
      next(err);
    }
  },
};
