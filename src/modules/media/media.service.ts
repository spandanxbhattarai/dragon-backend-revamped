import { mediaRepository } from './media.repository';
import { filesService } from '../files/files.service';
import { NotFoundError } from '../../lib/errors';
import type { CreateMediaInput, ListMediaQuery } from './media.schema';

export const mediaService = {
  listMedia: async (query: ListMediaQuery) => {
    const offset = (query.page - 1) * query.limit;
    const { data, total } = await mediaRepository.findAll(
      { search: query.search, mimeType: query.mimeType },
      { limit: query.limit, offset },
    );
    const totalPages = Math.ceil(total / query.limit);
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages } };
  },

  getById: async (id: string) => {
    const item = await mediaRepository.findById(id);
    if (!item) throw new NotFoundError('Media not found');
    return item;
  },

  createMedia: async (input: CreateMediaInput & { s3Key?: string }, uploadedBy: string) => {
    return await mediaRepository.create({ ...input, uploadedBy });
  },

  deleteMedia: async (id: string) => {
    const item = await mediaRepository.findById(id);
    if (!item) throw new NotFoundError('Media not found');
    if (item.s3Key) {
      await filesService.deleteFile(item.s3Key).catch(() => {});
    }
    await mediaRepository.remove(id);
  },
};
