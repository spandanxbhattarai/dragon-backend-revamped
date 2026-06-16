import type { Request } from 'express';
import { BadRequestError } from './errors';

// @types/express v5 widens `req.params[key]` and `req.query[key]` to
// `string | string[]`. These helpers narrow back to plain strings at the
// boundary so controllers can pass values straight to services without
// per-call casts littering the code.

export const requireParam = (req: Request, key: string): string => {
  const v = req.params[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new BadRequestError(`Missing or invalid param: ${key}`);
  }
  return v;
};

export const optionalQuery = (req: Request, key: string): string | undefined => {
  const v = req.query[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
};
