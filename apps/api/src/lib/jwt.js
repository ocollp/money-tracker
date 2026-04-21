import jwt from 'jsonwebtoken';
import { isMongoUriConfigured } from './mongoEnv.js';

const JWT_SECRET = process.env.JWT_SECRET;

export function assertJwtConfigured() {
  if (isMongoUriConfigured() && !(JWT_SECRET && String(JWT_SECRET).trim())) {
    throw new Error('JWT_SECRET is required when a MongoDB URI is set');
  }
}

export function signAppJwt(googleSub) {
  return jwt.sign({ googleSub }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
}

export function verifyAppJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}
