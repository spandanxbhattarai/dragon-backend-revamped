import { classMaterialsRepository } from '../class-materials.repository';
import { coursesRepository } from '../../courses/courses.repository';
import { mailService } from '../../mail/mail.service';
import { env } from '../../../config/env';

function stripHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}…`;
}

export const materialNotificationService = {
  // Fire-and-forget. The mail service itself swallows send errors; this
  // wrapper only guards the lookup step before delegating to mailService.
  notifyEnrolledStudents: (params: {
    title: string;
    description: string | null;
    courseId: string;
  }) => {
    void (async () => {
      try {
        const [emails, course] = await Promise.all([
          classMaterialsRepository.findEnrolledEmailsByCourse(params.courseId),
          coursesRepository.findById(params.courseId),
        ]);
        if (emails.length === 0) return;

        const portalUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/dashboard/class-materials`;
        await mailService.sendClassMaterialAdded(emails, {
          title: params.title,
          description: truncate(stripHtml(params.description), 300),
          courseName: course?.title ?? 'your course',
          portalUrl,
        });
      } catch {
        // Silent — notifications are best-effort.
      }
    })();
  },
};
