// apps/backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface ITokenPayload {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role: 'admin' | 'user';
  [key: string]: any;
}

export function signToken(payload: ITokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): ITokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
}
