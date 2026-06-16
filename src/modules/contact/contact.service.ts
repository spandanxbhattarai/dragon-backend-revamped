import { contactRepository } from './contact.repository';
import { NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { CreateContactInput } from './contact.schema';
import { mailService } from '../mail/mail.service';

export const contactService = {
  createMessage: async (input: CreateContactInput) => {
    const entry = await contactRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone ? input.phone : null,
      subject: input.subject,
      message: input.message,
    });
    // Fire-and-forget: notify the admin that a new enquiry arrived.
    mailService.sendNewContactNotification({
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      subject: entry.subject,
      message: entry.message,
    });
    return entry;
  },

  listMessages: async (query: {
    page: number;
    limit: number;
    status?: 'pending' | 'replied';
    search?: string;
  }) => {
    const pagination = paginate(query);
    const { data, total } = await contactRepository.findAll(
      { status: query.status, search: query.search },
      pagination,
    );
    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getMessage: async (id: string) => {
    const entry = await contactRepository.findById(id);
    if (!entry) throw new NotFoundError('Contact message not found');
    return entry;
  },

  replyMessage: async (id: string, reply: string) => {
    const entry = await contactRepository.reply(id, reply);
    mailService.sendContactReply(entry.email, entry.name, entry.subject, entry.message, reply);
    return entry;
  },

  deleteMessage: async (id: string) => {
    await contactRepository.remove(id);
  },

  getStats: async () => {
    return contactRepository.getStats();
  },
};
