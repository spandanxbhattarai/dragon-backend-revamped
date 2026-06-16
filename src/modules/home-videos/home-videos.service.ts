import { homeVideosRepository } from './home-videos.repository';
import { NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { CreateHomeVideoInput, UpdateHomeVideoInput } from './home-videos.schema';

export const homeVideosService = {
  create: async (input: CreateHomeVideoInput) => {
    return await homeVideosRepository.create({
      title: input.title,
      description: input.description ?? null,
      videoUrl: input.videoUrl,
      videoMediaId: input.videoMediaId ?? null,
      bannerImageUrl: input.bannerImageUrl ?? null,
      bannerMediaId: input.bannerMediaId ?? null,
      position: input.position ?? 0,
      isActive: input.isActive,
    });
  },

  list: async (query: { page: number; limit: number; isActive?: string }) => {
    const pagination = paginate(query);
    const isActive =
      query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;

    const { data, total } = await homeVideosRepository.findAll({ isActive }, pagination);
    return { data, meta: paginationMeta(total, pagination.page, pagination.limit) };
  },

  getById: async (id: string) => {
    const v = await homeVideosRepository.findById(id);
    if (!v) throw new NotFoundError('Home video not found');
    return v;
  },

  update: async (id: string, input: UpdateHomeVideoInput) => {
    const existing = await homeVideosRepository.findById(id);
    if (!existing) throw new NotFoundError('Home video not found');
    return await homeVideosRepository.update(id, input);
  },

  remove: async (id: string) => {
    const existing = await homeVideosRepository.findById(id);
    if (!existing) throw new NotFoundError('Home video not found');
    await homeVideosRepository.remove(id);
  },
};
