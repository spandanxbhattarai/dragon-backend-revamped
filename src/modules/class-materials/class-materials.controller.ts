import { Response, NextFunction } from 'express';
import { classMaterialsService } from './class-materials.service';
import { ok, created, noContent } from '../../lib/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  createClassMaterialSchema,
  updateClassMaterialSchema,
  listMaterialsSchema,
  materialIdParamSchema,
} from './class-materials.schema';

export const classMaterialsController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = listMaterialsSchema.parse({ query: req.query });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await classMaterialsService.list(userId, userRole, query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params } = materialIdParamSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const material = await classMaterialsService.getById(userId, userRole, params.id);
      ok(res, material);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { body } = createClassMaterialSchema.parse({ body: req.body });
      const createdBy = req.user?.userId;
      const material = await classMaterialsService.create(body, createdBy);
      created(res, material);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params, body } = updateClassMaterialSchema.parse({
        params: req.params,
        body: req.body,
      });
      const material = await classMaterialsService.update(params.id, body);
      ok(res, material);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params } = materialIdParamSchema.parse({ params: req.params });
      await classMaterialsService.remove(params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  download: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params } = materialIdParamSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await classMaterialsService.download(userId, userRole, params.id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Returns a short-lived INLINE signed URL for the in-app viewer. The client
  // streams the file directly from S3 — no bytes pass through this server.
  viewUrl: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params } = materialIdParamSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await classMaterialsService.viewUrl(userId, userRole, params.id);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Same-origin byte proxy (PDFs). Inline, never an attachment.
  stream: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { params } = materialIdParamSchema.parse({ params: req.params });
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const result = await classMaterialsService.stream(userId, userRole, params.id);

      res.setHeader('Content-Type', result.contentType || result.mimeType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      if (result.contentLength !== undefined) {
        res.setHeader('Content-Length', String(result.contentLength));
      }
      result.body.on('error', (err) => next(err));
      result.body.pipe(res);
    } catch (err) {
      next(err);
    }
  },
};
