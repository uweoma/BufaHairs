import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { REFRESH_COOKIE, refreshCookieOptions, clearRefreshCookieOptions } from '../config/cookies';

const meta = (req: Request) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, meta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendCreated(res, { user, accessToken }, 'Account created successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendSuccess(res, { user, accessToken }, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token provided');
  const { user, accessToken, refreshToken } = await authService.refreshSession(token, meta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return sendSuccess(res, { user, accessToken }, 'Session refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
  return sendSuccess(res, null, 'Logged out successfully');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, { user }, 'OK');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  return sendSuccess(
    res,
    null,
    'If an account exists for that email, a reset link has been sent.',
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return sendSuccess(res, null, 'Password reset successfully. Please log in.');
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  return sendSuccess(res, null, 'Email verified successfully.');
});
