import { subscribersRepository } from './subscribers.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { SubscribeInput, BroadcastInput } from './subscribers.schema';
import { mailService } from '../mail/mail.service';

export const subscribersService = {
  subscribe: async (input: SubscribeInput) => {
    const existing = await subscribersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('This email is already subscribed');
    }
    return await subscribersRepository.create(input.email);
  },

  listSubscribers: async (query: { page: number; limit: number }) => {
    const pagination = paginate(query);
    const { data, total } = await subscribersRepository.findAll(pagination);
    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  unsubscribe: async (id: string) => {
    await subscribersRepository.remove(id);
  },

  broadcast: async (input: BroadcastInput) => {
    const emails = await subscribersRepository.findAllEmails();
    if (emails.length === 0) {
      throw new BadRequestError('There are no subscribers to send to.');
    }
    // Fire-and-forget: emails are sent in the background so the request
    // returns promptly even with a large recipient list.
    mailService.sendNewsletter(emails, { subject: input.subject, content: input.content });
    return { recipients: emails.length };
  },
};
