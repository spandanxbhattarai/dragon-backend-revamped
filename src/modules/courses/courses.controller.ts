import { Request, Response, NextFunction } from 'express';
import { coursesService } from './courses.service';
import { ok, created, noContent } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { CreateCourseInput, UpdateCourseInput, ListCoursesQuery } from './courses.schema';

export const coursesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as ListCoursesQuery;
      const result = await coursesService.listCourses(query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  listAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as ListCoursesQuery;
      const result = await coursesService.listAllCourses(query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await coursesService.getCourseById(requireParam(req, 'id'));
      ok(res, course);
    } catch (err) {
      next(err);
    }
  },

  getBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await coursesService.getCourseBySlug(requireParam(req, 'slug'));
      ok(res, course);
    } catch (err) {
      next(err);
    }
  },

  getMyCourse: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const course = await coursesService.getMyCourse(req.user!.userId);
      ok(res, course);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const course = await coursesService.createCourse(req.body as CreateCourseInput);
      created(res, course);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const course = await coursesService.updateCourse(requireParam(req, 'id'), req.body as UpdateCourseInput);
      ok(res, course);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await coursesService.deleteCourse(requireParam(req, 'id'));
      noContent(res);
    } catch (err) {
      next(err);
    }
  },

  recordView: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await coursesService.recordView(requireParam(req, 'id'));
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  topViewed: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const data = await coursesService.getTopViewed(limit);
      ok(res, data);
    } catch (err) {
      next(err);
    }
  },
};
