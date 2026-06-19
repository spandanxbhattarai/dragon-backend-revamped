import sanitizeHtml from 'sanitize-html';
import { coursesRepository } from './courses.repository';
import { slugify } from '../../utils/slugify';
import { paginate } from '../../utils/paginate';
import { NotFoundError } from '../../lib/errors';
import { CreateCourseInput, UpdateCourseInput, ListCoursesQuery } from './courses.schema';

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  'img', 'h1', 'h2', 'h3', 'span', 'u', 's',
]);

const ALLOWED_ATTRIBUTES = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*': ['class', 'style'],
  img: ['src', 'alt', 'width', 'height'],
};

const sanitize = (html: string): string =>
  sanitizeHtml(html, { allowedTags: ALLOWED_TAGS, allowedAttributes: ALLOWED_ATTRIBUTES });

const sanitizeCourseHtml = (input: CreateCourseInput | UpdateCourseInput) => ({
  ...input,
  description: input.description ? sanitize(input.description) : input.description,
  information: input.information ? sanitize(input.information) : input.information,
  freeFeatures: input.freeFeatures ? sanitize(input.freeFeatures) : input.freeFeatures,
  halfFeatures: input.halfFeatures ? sanitize(input.halfFeatures) : input.halfFeatures,
  paidFeatures: input.paidFeatures ? sanitize(input.paidFeatures) : input.paidFeatures,
});

const generateUniqueSlug = async (title: string): Promise<string> => {
  const existingSlugs = await coursesRepository.findSlugs();
  const base = slugify(title);
  let slug = base;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
};

export const coursesService = {
  createCourse: async (input: CreateCourseInput) => {
    const slug = await generateUniqueSlug(input.title);
    const sanitized = sanitizeCourseHtml(input) as CreateCourseInput;
    return coursesRepository.create({
      ...sanitized,
      slug,
      description: sanitized.description!,
      mediaId: sanitized.mediaId ?? null,
    } as any);
  },

  listCourses: async (query: ListCoursesQuery) => {
    const { page, limit, courseType, search, isTrending, categoryId, uncategorized } = query;
    const { offset } = paginate({ page, limit });
    const result = await coursesRepository.findAll(
      { courseType, search, isTrending, categoryId, uncategorized, activeOnly: true },
      { offset, limit },
    );
    return {
      data: result.data,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
    };
  },

  listAllCourses: async (query: ListCoursesQuery) => {
    const { page, limit, courseType, search } = query;
    const { offset } = paginate({ page, limit });
    const result = await coursesRepository.findAll(
      { courseType, search, activeOnly: false },
      { offset, limit },
    );
    return {
      data: result.data,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
    };
  },

  getCourseById: async (id: string) => {
    const course = await coursesRepository.findById(id);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  },

  getCourseBySlug: async (slug: string) => {
    const course = await coursesRepository.findBySlug(slug);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  },

  // The authenticated student's own enrolled course, including `information`.
  // Returns null when the user isn't enrolled in any course.
  getMyCourse: async (userId: string) => {
    return coursesRepository.findEnrolledByUser(userId);
  },

  updateCourse: async (id: string, input: UpdateCourseInput) => {
    const existing = await coursesRepository.findById(id);
    if (!existing) throw new NotFoundError('Course not found');

    const sanitized = sanitizeCourseHtml(input) as UpdateCourseInput;

    let slug: string | undefined;
    if (sanitized.title && sanitized.title !== existing.title) {
      slug = await generateUniqueSlug(sanitized.title);
    }

    return coursesRepository.update(id, {
      ...sanitized,
      ...(slug ? { slug } : {}),
    } as any);
  },

  deleteCourse: async (id: string) => {
    const course = await coursesRepository.findById(id);
    if (!course) throw new NotFoundError('Course not found');
    await coursesRepository.remove(id);
  },

  // Records a public page view (dedupe is handled client-side via localStorage).
  recordView: async (id: string) => {
    const views = await coursesRepository.incrementViews(id);
    if (views === null) throw new NotFoundError('Course not found');
    return { views };
  },

  // Admin analytics: courses ranked by view count.
  getTopViewed: async (limit = 10) => {
    return coursesRepository.findTopViewed(limit);
  },
};
