import { classMaterialsRepository } from '../class-materials.repository';
import { mediaRepository } from '../../media/media.repository';
import { coursesRepository } from '../../courses/courses.repository';
import { NotFoundError, BadRequestError } from '../../../lib/errors';
import { materialNotificationService } from './material-notification.service';
import type {
  CreateClassMaterialInput,
  UpdateClassMaterialInput,
} from '../class-materials.schema';

// Strip the storage URL — clients must use the download endpoint instead.
function stripFileUrl<T extends { fileUrl?: string | null }>(row: T) {
  const { fileUrl: _drop, ...rest } = row;
  return rest;
}

async function assertMediaAndCourse(mediaId: string, courseId: string) {
  const [mediaItem, course] = await Promise.all([
    mediaRepository.findById(mediaId),
    coursesRepository.findById(courseId),
  ]);
  if (!mediaItem) throw new BadRequestError('Selected media not found');
  if (!course) throw new BadRequestError('Selected course not found');
  return { mediaItem, course };
}

export const materialCrudService = {
  create: async (input: CreateClassMaterialInput, createdBy?: string) => {
    const { mediaItem } = await assertMediaAndCourse(input.mediaId, input.courseId);
    const row = await classMaterialsRepository.create({
      title: input.title,
      description: input.description ?? null,
      mediaId: input.mediaId,
      courseId: input.courseId,
      // Stored for legacy compatibility only — never returned to clients.
      fileUrl: mediaItem.url,
      createdBy: createdBy ?? null,
    });

    // Notify all students enrolled in this course. Fire-and-forget so a slow
    // mail provider doesn't block the API response.
    materialNotificationService.notifyEnrolledStudents({
      title: row.title,
      description: row.description,
      courseId: input.courseId,
    });

    return stripFileUrl(row);
  },

  update: async (id: string, input: UpdateClassMaterialInput) => {
    const existing = await classMaterialsRepository.findById(id);
    if (!existing) throw new NotFoundError('Class material not found');

    const patch: Parameters<typeof classMaterialsRepository.update>[1] = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;

    if (input.mediaId !== undefined) {
      const mediaItem = await mediaRepository.findById(input.mediaId);
      if (!mediaItem) throw new BadRequestError('Selected media not found');
      patch.mediaId = input.mediaId;
      patch.fileUrl = mediaItem.url;
    }

    if (input.courseId !== undefined) {
      const course = await coursesRepository.findById(input.courseId);
      if (!course) throw new BadRequestError('Selected course not found');
      patch.courseId = input.courseId;
    }

    const row = await classMaterialsRepository.update(id, patch);
    return stripFileUrl(row);
  },

  remove: async (id: string) => {
    const existing = await classMaterialsRepository.findById(id);
    if (!existing) throw new NotFoundError('Class material not found');
    await classMaterialsRepository.remove(id);
  },
};
