import { galleryRepository } from './gallery.repository';
import { NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { CreateGalleryInput, UpdateGalleryInput } from './gallery.schema';

export const galleryService = {
  create: async (input: CreateGalleryInput) => {
    return await galleryRepository.create({
      title: input.title,
      description: input.description ?? null,
      mediaType: input.mediaType,
      mediaUrl: input.mediaUrl,
      mediaId: input.mediaId ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      thumbnailMediaId: input.thumbnailMediaId ?? null,
      position: input.position ?? 0,
      isActive: input.isActive,
    });
  },

  list: async (query: { page: number; limit: number; isActive?: string }) => {
    const pagination = paginate(query);
    const isActive =
      query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;

    const { data, total } = await galleryRepository.findAll({ isActive }, pagination);
    return { data, meta: paginationMeta(total, pagination.page, pagination.limit) };
  },

  getById: async (id: string) => {
    const item = await galleryRepository.findById(id);
    if (!item) throw new NotFoundError('Gallery item not found');
    return item;
  },

  update: async (id: string, input: UpdateGalleryInput) => {
    const existing = await galleryRepository.findById(id);
    if (!existing) throw new NotFoundError('Gallery item not found');
    return await galleryRepository.update(id, input);
  },

  remove: async (id: string) => {
    const existing = await galleryRepository.findById(id);
    if (!existing) throw new NotFoundError('Gallery item not found');
    await galleryRepository.remove(id);
  },
};
