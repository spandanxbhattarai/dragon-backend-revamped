import sanitizeHtml from 'sanitize-html';
import { coursesRepository } from '../courses/courses.repository';

/**
 * Builds the PUBLIC-ONLY course context that is fed to the LLM.
 *
 * PRIVACY: this is the single source of facts the assistant is allowed to know.
 * It pulls ONLY the public course fields (the same ones the public
 * `GET /api/courses` route exposes) and strips HTML to plain text. It NEVER
 * touches class materials, exams, users, student profiles, payments, events or
 * announcements — those are private/gated and handled by redirecting the user.
 */

// course.description and the *Features columns are sanitized HTML in the DB;
// the model wants plain text, so strip every tag.
const toPlain = (html?: string | null): string =>
  html
    ? sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

interface CourseContext {
  text: string;
  at: number;
}

let cache: CourseContext | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function buildCourseContext(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text;

  // Active courses only — same filter as the public list route.
  const { data } = await coursesRepository.findAll(
    { activeOnly: true },
    { offset: 0, limit: 100 },
  );

  const blocks = (data as Array<Record<string, any>>).map((c) => {
    const price =
      c.price != null && c.price !== ''
        ? `Rs. ${c.price}`
        : 'see the course page / contact us';
    return [
      `### ${c.title}`,
      `Type: ${c.courseType} | Duration: ${c.durationDays} days | Price: ${price}`,
      `Overview: ${c.overview}`,
      `Schedule & Curriculum:\n${toPlain(c.description) || 'Not specified.'}`,
      `Free plan includes:\n${toPlain(c.freeFeatures) || 'Not specified.'}`,
      `Half plan includes:\n${toPlain(c.halfFeatures) || 'Not specified.'}`,
      `Paid plan includes:\n${toPlain(c.paidFeatures) || 'Not specified.'}`,
    ].join('\n');
  });

  const text = blocks.length
    ? blocks.join('\n\n---\n\n')
    : 'No active courses are currently published.';

  cache = { text, at: Date.now() };
  return text;
}
