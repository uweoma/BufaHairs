import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './config/logger';

async function bootstrap() {
  // Fail fast if the database is unreachable.
  await prisma.$connect();
  logger.info('✅ Database connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 BufaHairs API listening on http://localhost:${env.PORT}/api`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
    if (!env.paystackEnabled) logger.warn('⚠️  Paystack not configured — payments disabled.');
    if (!env.emailEnabled) logger.warn('⚠️  Resend not configured — emails will be logged only.');
    if (!env.cloudinaryEnabled)
      logger.warn('⚠️  Cloudinary not configured — image uploads use passed URLs only.');
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Closed out remaining connections.');
      process.exit(0);
    });
    // Force-exit if not closed in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
