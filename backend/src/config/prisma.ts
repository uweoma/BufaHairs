import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma singleton — prevents connection storms during dev hot-reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
