import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  userId: string;
  role: string;
};

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

// Aliases kept for any existing imports
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
