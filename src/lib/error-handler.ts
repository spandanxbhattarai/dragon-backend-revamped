import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      code: err.code,
      message: err.message,
    };
    if ('errors' in err) body.errors = (err as any).errors;
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong',
  });
};
