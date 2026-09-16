import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { ApiError } from './utils/ApiError';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // Behind a proxy (docker/render/heroku) — needed for correct client IPs + rate limiting.
  app.set('trust proxy', 1);

  // --- Security headers ---
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProd ? undefined : false,
    }),
  );

  // --- CORS (credentialed) ---
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server (no Origin header) and whitelisted origins.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new ApiError(403, `Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );

  // --- Body parsing with size limits ---
  // NOTE: the Paystack webhook needs the raw body for signature verification;
  // that route registers its own express.raw() parser before this runs, so we
  // skip JSON parsing for it here.
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') return next();
    return express.json({ limit: '1mb' })(req, res, next);
  });
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(cookieParser());
  app.use(compression());
  app.use(hpp());

  // --- Request logging ---
  if (!env.isTest) {
    app.use(
      morgan(env.isDev ? 'dev' : 'combined', {
        stream: { write: (msg) => logger.info(msg.trim()) },
      }),
    );
  }

  // --- Rate limiting (global) ---
  app.use('/api', globalLimiter);

  // --- Routes ---
  app.use('/api', apiRouter);

  // --- 404 + centralized errors ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
