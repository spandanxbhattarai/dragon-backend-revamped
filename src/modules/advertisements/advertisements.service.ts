import { advertisementsRepository } from './advertisements.repository';
import { NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { CreateAdInput, UpdateAdInput } from './advertisements.schema';

export const advertisementsService = {
  createAd: async (input: CreateAdInput) => {
    return await advertisementsRepository.create({
      title: input.title,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      mediaId: input.mediaId ?? null,
      linkUrl: input.linkUrl ?? null,
      buttonText: input.buttonText ?? null,
      redirectUrl: input.redirectUrl ?? null,
      privacy: input.privacy ?? 'public',
      isActive: input.isActive,
    });
  },

  listAds: async (query: { page: number; limit: number; isActive?: string }) => {
    const pagination = paginate(query);
    const isActive =
      query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;

    const { data, total } = await advertisementsRepository.findAll({ isActive }, pagination);
    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getAdById: async (id: string) => {
    const ad = await advertisementsRepository.findById(id);
    if (!ad) throw new NotFoundError('Advertisement not found');
    return ad;
  },

  updateAd: async (id: string, input: UpdateAdInput) => {
    const existing = await advertisementsRepository.findById(id);
    if (!existing) throw new NotFoundError('Advertisement not found');
    return await advertisementsRepository.update(id, input);
  },

  deleteAd: async (id: string) => {
    const existing = await advertisementsRepository.findById(id);
    if (!existing) throw new NotFoundError('Advertisement not found');
    await advertisementsRepository.remove(id);
  },
};
