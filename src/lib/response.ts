import { Response } from 'express';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const ok = (
  res: Response,
  data: unknown,
  meta?: PaginationMeta | Record<string, unknown>,
): void => {
  res.status(200).json({ success: true, data, ...(meta && { meta }) });
};

export const created = (res: Response, data: unknown): void => {
  res.status(201).json({ success: true, data });
};

export const noContent = (res: Response): void => {
  res.status(204).send();
};
