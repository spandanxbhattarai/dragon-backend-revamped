import crypto from 'crypto';
import { authRepository } from '../auth.repository';
import { signAccessToken, JwtPayload } from '../../../utils/jwt';
import { UnauthorizedError } from '../../../lib/errors';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (raw: string) =>
  crypto.createHash('sha256').update(raw).digest('hex');

export const tokenService = {
  generateTokenPair: async (payload: JwtPayload) => {
    const accessToken = signAccessToken(payload);
    const raw = crypto.randomBytes(64).toString('hex');
    const hashed = hashToken(raw);
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

    await authRepository.insertRefreshToken({
      userId: payload.userId,
      token: hashed,
      expiresAt,
    });

    return { accessToken, refreshToken: raw };
  },

  rotateRefreshToken: async (raw: string) => {
    const hashed = hashToken(raw);
    const row = await authRepository.findActiveRefreshTokenWithUser(hashed);

    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // A blocked account must not be able to mint fresh tokens.
    if (row.isBlocked) {
      throw new UnauthorizedError('Your account has been blocked');
    }

    await authRepository.revokeRefreshTokenById(row.id);

    return tokenService.generateTokenPair({ userId: row.userId, role: row.role });
  },

  revokeOne: async (raw: string) => {
    await authRepository.revokeRefreshTokenByToken(hashToken(raw));
  },

  revokeAllForUser: async (userId: string) => {
    await authRepository.revokeAllRefreshTokensForUser(userId);
  },
};
