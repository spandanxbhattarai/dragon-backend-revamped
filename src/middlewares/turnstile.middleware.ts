import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { BadRequestError } from '../lib/errors';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token on public (unauthenticated) POST routes
 * to deter bots/spam. The token is sent by the client in `turnstileToken`
 * (body) or the `cf-turnstile-response` header.
 *
 * Runs BEFORE `validate(...)` (which strips unknown fields), and deletes the
 * token from the body afterwards so downstream schemas/handlers never see it.
 *
 * Dev/test fallback: when no secret key is configured, verification is skipped
 * so local development and tests keep working without Turnstile keys.
 */
export const verifyTurnstile = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      // No secret configured — skip (local dev / tests).
      return next();
    }

    const token =
      (req.body?.turnstileToken as string | undefined) ||
      (req.headers['cf-turnstile-response'] as string | undefined);

    if (!token) {
      throw new BadRequestError('Captcha verification required.');
    }

    const params = new URLSearchParams();
    params.append('secret', env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
    params.append('response', token);
    if (req.ip) params.append('remoteip', req.ip);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      throw new BadRequestError('Captcha verification failed. Please try again.');
    }

    // Keep the parsed body clean for downstream validation/handlers.
    if (req.body && typeof req.body === 'object') {
      delete (req.body as Record<string, unknown>).turnstileToken;
    }

    next();
  } catch (err) {
    next(err);
  }
};
