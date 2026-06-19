import { Request, Response, NextFunction } from 'express';

/**
 * Tiny in-memory, per-IP fixed-window rate limiter. No external deps.
 *
 * Intended for low-volume public endpoints (e.g. the chatbot) where each
 * request has a real cost (LLM call). For a multi-instance deployment a shared
 * store (Redis) would be needed, but for a single Node process this is enough
 * to deter abuse.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export const rateLimit = (opts: { windowMs: number; max: number }) => {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    // Opportunistic cleanup of expired buckets.
    if (buckets.size > 5000) {
      for (const [key, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(key);
      }
    }

    const bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(ip, { count: 1, resetAt: now + opts.windowMs });
      next();
      return;
    }

    if (bucket.count >= opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message: 'Too many messages. Please wait a moment and try again.',
      });
      return;
    }

    bucket.count += 1;
    next();
  };
};
