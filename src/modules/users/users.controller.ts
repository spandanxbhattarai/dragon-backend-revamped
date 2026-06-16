import { Response, NextFunction } from 'express';
import { userCrudService } from './services/user-crud.service';
import { userProfileService } from './services/user-profile.service';
import { userAdminService } from './services/user-admin.service';
import { usersRepository } from './users.repository';
import { ok, created } from '../../lib/response';
import { requireParam } from '../../lib/req';
import { AuthRequest } from '../../middlewares/auth.middleware';
import type {
  ListUsersQuery,
  CreateUserInput,
  UpdateUserInput,
  ResetPasswordInput,
  BlockUserInput,
  UpdateProfileInput,
} from './users.schema';

export const usersController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const result = await userCrudService.listUsers(query);
      ok(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const user = await userCrudService.getUserById(id);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input = req.body as CreateUserInput;
      const user = await userCrudService.createUser(input);
      created(res, user);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const input = req.body as UpdateUserInput;
      const user = await userCrudService.updateUser(id, input);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  verify: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const user = await userAdminService.verifyUser(id);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  block: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const { blocked } = req.body as BlockUserInput;
      const user = await userAdminService.blockUser(id, blocked);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  unlock: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const user = await userAdminService.unlockUser(id);
      ok(res, user);
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const { newPassword } = req.body as ResetPasswordInput;
      const result = await userAdminService.resetPassword(id, newPassword);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const profile = await userProfileService.getProfile(id, req.user!.userId, req.user!.role);
      ok(res, profile);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const input = req.body as UpdateProfileInput;
      const profile = await userProfileService.updateProfile(id, input, req.user!.userId, req.user!.role);
      ok(res, profile);
    } catch (err) {
      next(err);
    }
  },

  getTeachersForAbout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const teachers = await usersRepository.findTeachersForAbout();
      ok(res, teachers);
    } catch (err) {
      next(err);
    }
  },

  updateEnrollment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = requireParam(req, 'id');
      const { courseId, paymentImage, citizenshipCertificate } = req.body;
      const profile = await userProfileService.updateEnrollment(
        id,
        { courseId, paymentImage, citizenshipCertificate },
        req.user!.userId,
        req.user!.role,
      );
      ok(res, profile);
    } catch (err) {
      next(err);
    }
  },
};
