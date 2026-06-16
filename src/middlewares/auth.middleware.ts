import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../lib/errors';
import { authRepository } from '../modules/auth/auth.repository';

declare global {
  namespace Express {
    interface User {
      userId: string;
      role: string;
    }
  }
}

export type AuthRequest = Request & {
  user?: { userId: string; role: string };
};

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  let payload: { userId: string; role: string };
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');
    const token = header.split(' ')[1];
    payload = verifyToken(token);
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
    return;
  }

  // Blocked accounts are rejected on EVERY authenticated call (401), even with
  // an otherwise-valid token — so blocking takes effect immediately.
  try {
    const state = await authRepository.getUserAuthState(payload.userId);
    if (!state) {
      next(new UnauthorizedError('Account no longer exists'));
      return;
    }
    if (state.isBlocked) {
      next(new UnauthorizedError('Your account has been blocked'));
      return;
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

// Soft variant: populates req.user when a valid Bearer is present, but lets
// the request continue when there isn't one. Use for endpoints whose
// response shape varies for anonymous vs logged-in callers (e.g. public
// announcements list that auto-includes course-targeted items for the
// logged-in student).
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const token = header.split(' ')[1];
    req.user = verifyToken(token);
  } catch {
    // Invalid token on an optional route — treat as anonymous, do not
    // reject. Endpoints relying on req.user must still null-check.
  }
  next();
};
