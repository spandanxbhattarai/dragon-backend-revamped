import { eventsRepository } from './events.repository';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { mailService } from '../mail/mail.service';
import { CreateEventInput, UpdateEventInput } from './events.schema';

type Requester = { userId: string; role: string } | undefined;

type CreatedEvent = Awaited<ReturnType<typeof eventsRepository.create>>;

// Fire-and-forget. mailService swallows transport errors; this guard covers
// the lookup step so any failure here never affects the create() caller.
function notifyAfterCreate(input: CreateEventInput, event: CreatedEvent) {
  if (input.privacy && input.privacy !== 'public') return;

  void (async () => {
    try {
      const emails = await eventsRepository.getSubscriberEmails();
      if (emails.length === 0) return;
      await mailService.sendEvent(emails, {
        title: event.title,
        description: event.description,
        startDate: event.eventDate.toISOString(),
        endDate: event.eventDate.toISOString(),
        venueName: event.address ?? '',
        venueAddress: event.address ?? '',
        eventType: event.category,
      });
    } catch {
      // Silent — event emails are best-effort.
    }
  })();
}

export const eventsService = {
  create: async (input: CreateEventInput) => {
    const event = await eventsRepository.create(input);
    notifyAfterCreate(input, event);
    return event;
  },

  list: async (
    query: {
      page: number;
      limit: number;
      privacy?: string;
      search?: string;
    },
    requester: Requester,
  ) => {
    const pagination = paginate(query);

    const filters: {
      privacy?: string;
      search?: string;
      enrolledCourseId?: string;
    } = {
      search: query.search,
    };

    if (requester?.role === 'admin' || requester?.role === 'teacher') {
      if (query.privacy) filters.privacy = query.privacy;
    } else if (requester?.role === 'student') {
      const courseId = await eventsRepository.findStudentCourseId(requester.userId);
      if (courseId) filters.enrolledCourseId = courseId;
      else filters.privacy = 'public';
    } else {
      filters.privacy = 'public';
    }

    const { data, total } = await eventsRepository.findAll(filters, pagination);

    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getById: async (id: string, requester: Requester) => {
    const event = await eventsRepository.findById(id);
    if (!event) throw new NotFoundError('Event not found');

    if (event.privacy === 'public') return event;
    if (requester?.role === 'admin' || requester?.role === 'teacher') return event;

    if (!requester) {
      throw new ForbiddenError('Sign in to view this event');
    }
    if (!event.courseId && requester.role === 'student') {
      return event;
    }
    if (event.courseId && requester.role === 'student') {
      const courseId = await eventsRepository.findStudentCourseId(requester.userId);
      if (courseId === event.courseId) return event;
    }
    throw new ForbiddenError('You do not have access to this event');
  },

  update: async (id: string, input: UpdateEventInput) => {
    const existing = await eventsRepository.findById(id);
    if (!existing) throw new NotFoundError('Event not found');
    return await eventsRepository.update(id, input);
  },

  remove: async (id: string) => {
    const existing = await eventsRepository.findById(id);
    if (!existing) throw new NotFoundError('Event not found');
    await eventsRepository.remove(id);
  },
};
