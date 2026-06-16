import { Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { filesService } from './files.service';
import { mediaService } from '../media/media.service';
import { created } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { BadRequestError } from '../../lib/errors';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed`));
    }
  },
});

export const filesController = {
  uploadFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided');
      }

      const folder = (req.body?.folder as string) || 'uploads';
      const ext = path.extname(req.file.originalname);
      const base = path
        .basename(req.file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const filename = `${base}-${uuidv4()}${ext}`;
      const key = `${folder.replace(/\/$/, '')}/${filename}`;

      const publicUrl = await filesService.uploadBuffer(
        req.file.buffer,
        key,
        req.file.mimetype,
      );

      const mediaRecord = await mediaService.createMedia(
        {
          filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: publicUrl,
          s3Key: key,
        },
        req.user!.userId,
      );

      created(res, mediaRecord);
    } catch (err) {
      next(err);
    }
  },
};
