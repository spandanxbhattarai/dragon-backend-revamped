import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authRepository } from '../auth.repository';
import { hashPassword } from '../../../utils/hash';
import { tokenService } from './token.service';
import { filesService } from '../../files/files.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../lib/errors';
import { mailService } from '../../mail/mail.service';
import type { RegisterInput } from '../auth.schema';

type RegisterFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

type RegisterFiles = {
  citizenshipFile?: RegisterFile;
  paymentFile?: RegisterFile;
};

const stripPassword = <T extends { passwordHash?: string }>(user: T) => {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
};

const uploadDocFile = async (file: RegisterFile, prefix: 'citizenship' | 'payment') => {
  const ext = path.extname(file.originalname) || '';
  const key = `${prefix}/doc-${uuidv4()}${ext}`;
  return filesService.uploadBuffer(file.buffer, key, file.mimetype);
};

export const authService = {
  register: async (input: RegisterInput, files: RegisterFiles = {}) => {
    if (await authRepository.findUserByEmail(input.email)) {
      throw new ConflictError('A user with this email already exists');
    }
    if (await authRepository.findUserByPhone(input.phone)) {
      throw new ConflictError('A user with this phone number already exists');
    }

    if (!files.citizenshipFile) {
      throw new BadRequestError('Citizenship certificate is required');
    }
    if (input.plan !== 'free' && !files.paymentFile) {
      throw new BadRequestError('Payment image is required for paid plans');
    }

    // Upload first so we don't create a user row if S3 is unreachable.
    const citizenshipCertificate = await uploadDocFile(files.citizenshipFile, 'citizenship');
    const paymentImage = files.paymentFile
      ? await uploadDocFile(files.paymentFile, 'payment')
      : null;

    const passwordHash = await hashPassword(input.password);

    const user = await authRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'student',
      isVerified: false,
      isBlocked: false,
    });

    await authRepository.createStudentProfile({
      userId: user.id,
      plan: input.plan ?? 'free',
      courseId: input.courseId ?? null,
      paymentImage,
      citizenshipCertificate,
    });

    // Intentionally no user-facing email here. Students only hear from us
    // once an admin verifies the account — that mail is the "account is
    // active" signal. Admin still gets the new-registration notification
    // below.
    const courseTitle = input.courseId
      ? (await authRepository.findCourseTitleById(input.courseId)) ?? undefined
      : undefined;

    mailService.sendNewUserAdminNotification({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      plan: input.plan ?? 'free',
      courseTitle,
    });

    return stripPassword(user);
  },

  login: async (payload: { userId: string; role: string }) => {
    const user = await authRepository.findUserById(payload.userId);
    if (!user) throw new UnauthorizedError('User not found');
    if (!user.isVerified) throw new ForbiddenError('Account not verified');
    if (user.isBlocked) throw new ForbiddenError('Account is blocked');
    if (user.loginLocked) throw new ForbiddenError('Account is locked');

    const tokens = await tokenService.generateTokenPair({
      userId: user.id,
      role: user.role,
    });
    return { ...tokens, user: stripPassword(user) };
  },

  getMe: async (userId: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return stripPassword(user);
  },
};
