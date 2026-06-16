import { announcementsRepository } from './announcements.repository';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { paginate, paginationMeta } from '../../utils/paginate';
import { mailService } from '../mail/mail.service';
import { CreateAnnouncementInput, UpdateAnnouncementInput } from './announcements.schema';

type Requester = { userId: string; role: string } | undefined;

function buildEmailPayload(input: CreateAnnouncementInput) {
  return {
    title: input.title,
    content: [input.description.replace(/<[^>]*>/g, '').slice(0, 200)],
    announcedDate: new Date().toISOString(),
  };
}

// Fire-and-forget. mailService swallows transport errors; this guard covers
// the email-lookup step so SMTP/DB hiccups never affect create() callers.
function notifyAfterCreate(input: CreateAnnouncementInput) {
  void (async () => {
    try {
      const payload = buildEmailPayload(input);
      const emails =
        input.privacy === 'enrolled' && input.courseId
          ? await announcementsRepository.getEnrolledUserEmails(input.courseId)
          : await announcementsRepository.getAllUserEmails();
      if (emails.length === 0) return;
      await mailService.sendAnnouncement(emails, payload);
    } catch {
      // Silent — announcement emails are best-effort.
    }
  })();
}

export const announcementsService = {
  create: async (input: CreateAnnouncementInput) => {
    const announcement = await announcementsRepository.create(input);
    notifyAfterCreate(input);
    return announcement;
  },

  list: async (
    query: { page: number; limit: number; search?: string; privacy?: string },
    requester: Requester,
  ) => {
    const pagination = paginate(query);

    // Server-side scoping: admins/teachers see everything; students see
    // public + their-course; anonymous callers see only public. The
    // student's courseId is derived from their session, never trusted
    // from the query, so a client can't peek at another course's items.
    const filters: { search?: string; privacy?: string; enrolledCourseId?: string } = {
      search: query.search,
    };

    if (requester?.role === 'admin' || requester?.role === 'teacher') {
      if (query.privacy) filters.privacy = query.privacy;
    } else if (requester?.role === 'student') {
      const courseId = await announcementsRepository.findStudentCourseId(requester.userId);
      if (courseId) filters.enrolledCourseId = courseId;
      else filters.privacy = 'public';
    } else {
      filters.privacy = 'public';
    }

    const { data, total } = await announcementsRepository.findAll(filters, pagination);
    return {
      data,
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getById: async (id: string, requester: Requester) => {
    const announcement = await announcementsRepository.findById(id);
    if (!announcement) throw new NotFoundError('Announcement not found');

    if (announcement.privacy === 'public') return announcement;
    if (requester?.role === 'admin' || requester?.role === 'teacher') return announcement;

    if (!requester) {
      throw new ForbiddenError('Sign in to view this announcement');
    }
    // Enrolled-with-no-courseId: any authenticated student is fine.
    if (!announcement.courseId && requester.role === 'student') {
      return announcement;
    }
    // Enrolled-for-specific-course: caller must be in that course.
    if (announcement.courseId && requester.role === 'student') {
      const courseId = await announcementsRepository.findStudentCourseId(requester.userId);
      if (courseId === announcement.courseId) return announcement;
    }
    throw new ForbiddenError('You do not have access to this announcement');
  },

  update: async (id: string, input: UpdateAnnouncementInput) => {
    const existing = await announcementsRepository.findById(id);
    if (!existing) throw new NotFoundError('Announcement not found');
    return await announcementsRepository.update(id, input);
  },

  remove: async (id: string) => {
    const existing = await announcementsRepository.findById(id);
    if (!existing) throw new NotFoundError('Announcement not found');
    await announcementsRepository.remove(id);
  },
};
