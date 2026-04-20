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

const PRISMA_INIT_MAX_RETRIES = 5;
const PRISMA_INIT_RETRY_DELAY_MS = 2000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const initializePrisma = async (): Promise<void> => {
  if (!prismaInitPromise) {
    prismaInitPromise = (async () => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= PRISMA_INIT_MAX_RETRIES; attempt += 1) {
        try {
          await prisma.$connect();
          logger.info({ attempt }, 'Prisma database connection established');
          return;
        } catch (error) {
          lastError = error;
          const isLastAttempt = attempt === PRISMA_INIT_MAX_RETRIES;

          logger.error(
            { error, attempt, maxRetries: PRISMA_INIT_MAX_RETRIES },
            'Prisma connection attempt failed',
          );

          if (!isLastAttempt) {
            await sleep(PRISMA_INIT_RETRY_DELAY_MS);
          }
        }
      }

      if (!hasLoggedInitFailure) {
        hasLoggedInitFailure = true;
        logger.fatal(
          { error: lastError, retries: PRISMA_INIT_MAX_RETRIES },
          'Prisma initialization failed after retries. Check DATABASE_URL and PostgreSQL credentials.',
        );
      }

      throw lastError;
    })();
  }

  return prismaInitPromise;
};

export default prisma;
