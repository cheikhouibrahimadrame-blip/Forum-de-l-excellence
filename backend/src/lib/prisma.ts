import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const createPrismaClient = () => {
  logger.info('Creating PrismaClient instance');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

let prismaInitPromise: Promise<void> | null = null;
let hasLoggedInitFailure = false;

export const initializePrisma = async (): Promise<void> => {
  if (!prismaInitPromise) {
    prismaInitPromise = prisma
      .$connect()
      .then(() => {
        logger.info('Prisma database connection established');
      })
      .catch((error) => {
        if (!hasLoggedInitFailure) {
          hasLoggedInitFailure = true;
          logger.fatal({ error }, 'Prisma initialization failed. Check DATABASE_URL and PostgreSQL credentials.');
        }
        throw error;
      });
  }

  return prismaInitPromise;
};

export default prisma;
