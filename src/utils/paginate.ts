export type PaginateOptions = {
  page?: number | string;
  limit?: number | string;
};

export type PaginationResult = {
  offset: number;
  limit: number;
  page: number;
};

export const paginate = (options: PaginateOptions): PaginationResult => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
  const offset = (page - 1) * limit;
  return { offset, limit, page };
};

export const paginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
