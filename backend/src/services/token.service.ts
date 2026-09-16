import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { sha256 } from '../utils/crypto';
import { parseDurationMs } from '../utils/duration';
import { generateToken } from '../utils/tokens';
import { signRefreshToken, verifyRefreshToken } from '../utils/jwt';

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

/** Issues a new refresh token and persists its hash. Returns the raw token. */
export async function issueRefreshToken(userId: string, meta: RequestMeta): Promise<string> {
  const jti = generateToken(16);
  const token = signRefreshToken({ sub: userId, jti });
  const expiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip,
    },
  });

  return token;
}

/**
 * Rotates a refresh token: validates the presented token, revokes it, and
 * issues a fresh one. Detects reuse of an already-revoked token and, as a
 * safety response, revokes every session for that user.
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta: RequestMeta,
): Promise<{ userId: string; token: string }> {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const tokenHash = sha256(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) throw ApiError.unauthorized('Refresh token not recognized');

  // Reuse of a revoked token => likely theft. Nuke all sessions.
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  if (existing.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  // Rotate atomically: revoke the old, mint the new.
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const token = await issueRefreshToken(payload.sub, meta);
  return { userId: payload.sub, token };
}

/** Revokes a single refresh token (logout). Silent if not found. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revokes all active refresh tokens for a user (e.g. on password reset). */
export async function revokeAllForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
