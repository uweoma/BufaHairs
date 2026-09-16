import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { generateToken } from '../utils/tokens';
import { sha256 } from '../utils/crypto';
import { toPublicUser, type PublicUser } from '../utils/serialize';
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
} from './token.service';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './email/auth-emails';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function accessTokenFor(user: { id: string; email: string; role: PublicUser['role'] }) {
  return signAccessToken({ sub: user.id, email: user.email, role: user.role });
}

async function createEmailVerification(userId: string): Promise<string> {
  const rawToken = generateToken(32);
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: sha256(rawToken),
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    },
  });
  return rawToken;
}

export async function register(input: RegisterInput, meta: RequestMeta): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);

  // Create the user together with their (empty) cart and wishlist.
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  const verifyToken = await createEmailVerification(user.id);
  await Promise.all([
    sendWelcomeEmail(user.email, user.fullName),
    sendVerificationEmail(user.email, user.fullName, verifyToken),
  ]);

  const accessToken = accessTokenFor(user);
  const refreshToken = await issueRefreshToken(user.id, meta);
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Uniform error to avoid user enumeration.
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Your account has been disabled');

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const accessToken = accessTokenFor(user);
  const refreshToken = await issueRefreshToken(user.id, meta);
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function refreshSession(rawToken: string, meta: RequestMeta): Promise<AuthResult> {
  const { userId, token } = await rotateRefreshToken(rawToken, meta);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw ApiError.unauthorized('Session no longer valid');
  const accessToken = accessTokenFor(user);
  return { user: toPublicUser(user), accessToken, refreshToken: token };
}

export async function logout(rawToken?: string): Promise<void> {
  if (rawToken) await revokeRefreshToken(rawToken);
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always succeed silently — do not reveal whether the email exists.
  if (!user) return;

  const rawToken = generateToken(32);
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(rawToken),
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });
  await sendPasswordResetEmail(user.email, user.fullName, rawToken);
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!record || record.type !== 'PASSWORD_RESET' || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset link');
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  // Invalidate all existing sessions after a password change.
  await revokeAllForUser(record.userId);
}

export async function verifyEmail(token: string): Promise<void> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!record || record.type !== 'EMAIL_VERIFY' || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification link');
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
