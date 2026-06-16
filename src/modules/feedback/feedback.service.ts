import { feedbackRepository } from './feedback.repository';
import { NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { CreateFeedbackInput } from './feedback.schema';
import { mailService } from '../mail/mail.service';

export const feedbackService = {
  createFeedback: async (input: CreateFeedbackInput) => {
    return await feedbackRepository.create({
      name: input.name,
      email: input.email,
      rating: input.rating,
      feedbackText: input.feedbackText,
    });
  },

  listFeedback: async (query: { page: number; limit: number; rating?: number }) => {
    const pagination = paginate(query);
    const { data, total } = await feedbackRepository.findAll(
      { rating: query.rating },
      pagination,
    );
    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  listPublicFeedback: async () => {
    return feedbackRepository.findPublic();
  },

  replyFeedback: async (id: string, reply: string) => {
    const entry = await feedbackRepository.reply(id, reply);
    mailService.sendFeedbackReply(entry.email, entry.name, entry.feedbackText, reply);
    return entry;
  },

  deleteFeedback: async (id: string) => {
    await feedbackRepository.remove(id);
  },

  getStats: async () => {
    const [averageRating, totalResult] = await Promise.all([
      feedbackRepository.getAverageRating(),
      feedbackRepository.findAll({}, { offset: 0, limit: 1, page: 1 }).then((r) => r.total),
    ]);

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalFeedback: totalResult,
    };
  },
};
