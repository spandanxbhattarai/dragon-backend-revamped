import { classMaterialsRepository } from '../class-materials.repository';
import { mediaRepository } from '../../media/media.repository';
import { filesService } from '../../files/files.service';
import { paginate, paginationMeta } from '../../../utils/paginate';
import { NotFoundError, ForbiddenError } from '../../../lib/errors';
import type { ListMaterialsQuery } from '../class-materials.schema';

const PRIVILEGED_ROLES = new Set(['admin', 'teacher']);
const DOWNLOAD_URL_TTL_SECONDS = 300;
// Inline view URLs must survive a whole viewing session (video playback, PDF
// page-by-page fetches), so they live longer than one-shot downloads.
const VIEW_URL_TTL_SECONDS = 60 * 60;

type RawMaterial = Awaited<ReturnType<typeof classMaterialsRepository.findById>>;

// Public response shape — never leaks the storage URL or S3 key.
function sanitize<T extends NonNullable<RawMaterial>>(m: T) {
  const { fileUrl: _fileUrl, media, ...rest } = m;
  const safeMedia = media
    ? {
        id: media.id,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
      }
    : null;
  return { ...rest, media: safeMedia };
}

async function resolveCourseFilter(
  userId: string,
  userRole: string,
  requested?: string,
): Promise<{ courseId?: string; emptyForStudent: boolean }> {
  if (PRIVILEGED_ROLES.has(userRole)) {
    return { courseId: requested, emptyForStudent: false };
  }
  const studentCourseId = await classMaterialsRepository.findStudentCourseId(userId);
  if (!studentCourseId) return { emptyForStudent: true, courseId: undefined };
  return { courseId: studentCourseId, emptyForStudent: false };
}

async function assertCanAccess(userId: string, userRole: string, material: NonNullable<RawMaterial>) {
  if (PRIVILEGED_ROLES.has(userRole)) return;
  const studentCourseId = await classMaterialsRepository.findStudentCourseId(userId);
  if (!material.courseId || material.courseId !== studentCourseId) {
    throw new ForbiddenError('You do not have access to this material');
  }
}

export const materialQueryService = {
  list: async (userId: string, userRole: string, query: ListMaterialsQuery) => {
    const filter = await resolveCourseFilter(userId, userRole, query.courseId);
    const pagination = paginate({ page: query.page, limit: query.limit });

    if (filter.emptyForStudent) {
      return { data: [], meta: paginationMeta(0, pagination.page, pagination.limit) };
    }

    const { data, total } = await classMaterialsRepository.findAll(
      { search: query.search, courseId: filter.courseId },
      pagination,
    );
    return {
      data: data.map((m) => sanitize(m as NonNullable<RawMaterial>)),
      meta: paginationMeta(total, pagination.page, pagination.limit),
    };
  },

  getById: async (userId: string, userRole: string, id: string) => {
    const material = await classMaterialsRepository.findById(id);
    if (!material) throw new NotFoundError('Class material not found');
    await assertCanAccess(userId, userRole, material);
    return sanitize(material);
  },

  // Returns a short-lived signed URL. Caller must be authorised.
  // The URL itself is unguessable + expires, so it's safe to hand to the client.
  download: async (userId: string, userRole: string, id: string) => {
    const material = await classMaterialsRepository.findById(id);
    if (!material) throw new NotFoundError('Class material not found');
    await assertCanAccess(userId, userRole, material);

    // Re-read media so we get s3Key/url even if the join shape ever changes.
    if (!material.mediaId) throw new NotFoundError('No file attached to this material');
    const mediaItem = await mediaRepository.findById(material.mediaId);
    if (!mediaItem) throw new NotFoundError('Underlying media not found');

    if (mediaItem.s3Key) {
      const signedUrl = await filesService.getPresignedDownloadUrl(
        mediaItem.s3Key,
        DOWNLOAD_URL_TTL_SECONDS,
        mediaItem.originalName,
      );
      return { url: signedUrl, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
    }

    // Legacy media without an s3Key (e.g. external URL) — fall back to stored URL.
    return { url: mediaItem.url, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  },

  // Authorised, short-lived INLINE signed URL for the in-app viewer. The client
  // streams the file directly from S3 (no server bandwidth). Access is
  // course-gated exactly like getById/download.
  viewUrl: async (userId: string, userRole: string, id: string) => {
    const material = await classMaterialsRepository.findById(id);
    if (!material) throw new NotFoundError('Class material not found');
    await assertCanAccess(userId, userRole, material);

    if (!material.mediaId) throw new NotFoundError('No file attached to this material');
    const mediaItem = await mediaRepository.findById(material.mediaId);
    if (!mediaItem) throw new NotFoundError('Underlying media not found');

    if (mediaItem.s3Key) {
      const url = await filesService.getPresignedViewUrl(
        mediaItem.s3Key,
        VIEW_URL_TTL_SECONDS,
        mediaItem.mimeType,
      );
      return { url, expiresIn: VIEW_URL_TTL_SECONDS, mimeType: mediaItem.mimeType };
    }

    // Legacy media without an s3Key (external URL) — hand back the stored URL.
    return { url: mediaItem.url, expiresIn: VIEW_URL_TTL_SECONDS, mimeType: mediaItem.mimeType };
  },

  // Same-origin byte proxy for the in-app viewer (used for PDFs so pdf.js can
  // fetch without an S3 CORS rule). Course-gated like the rest.
  stream: async (userId: string, userRole: string, id: string) => {
    const material = await classMaterialsRepository.findById(id);
    if (!material) throw new NotFoundError('Class material not found');
    await assertCanAccess(userId, userRole, material);

    if (!material.mediaId) throw new NotFoundError('No file attached to this material');
    const mediaItem = await mediaRepository.findById(material.mediaId);
    if (!mediaItem || !mediaItem.s3Key) throw new NotFoundError('Underlying media not found');

    const s = await filesService.getObjectStream(mediaItem.s3Key);
    return { ...s, fileName: mediaItem.originalName, mimeType: mediaItem.mimeType };
  },
};
