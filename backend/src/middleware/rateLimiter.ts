import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import RedisStore from 'rate-limit-redis';
import type { RateLimitRequestHandler } from 'express-rate-limit';
import logger from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export type RateLimiters = {
  loginRateLimiter: RateLimitRequestHandler;
  refreshRateLimiter: RateLimitRequestHandler;
  passwordChangeRateLimiter: RateLimitRequestHandler;
  apiRateLimiter: RateLimitRequestHandler;
};

export const initializeRateLimiterStore = async (): Promise<RedisStore | undefined> => {
  const shouldUseRedis = process.env.NODE_ENV === 'production' || !!process.env.REDIS_URL;
  if (!shouldUseRedis) {
    logger.warn('Rate limiting: using memory store (development mode).');
    return undefined;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err: Error) => {
      logger.error({ err }, 'Redis Client Error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });

    await redisClient.connect();

    return new RedisStore({
      sendCommand: (...args: string[]) => redisClient!.sendCommand(args as any),
      prefix: 'rl:'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis required in production. Startup aborted.');
    }
    logger.warn('Rate limiting fallback to memory store (development only).');
    return undefined;
  }
};

/**
 * Rate limiter for login attempts
 * Prevents brute force attacks by limiting login attempts per IP
 * 
 * Configuration:
 * - 5 attempts per minute per IP
 * - Returns 429 (Too Many Requests) when limit exceeded
 * - Redis-backed store for distributed systems (production)
 * - Memory fallback for development
 */
export const createRateLimiters = (store?: RedisStore): RateLimiters => ({
  loginRateLimiter: rateLimit({
    store,
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // Max 5 requests per window per IP
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests (including successful)
    skipFailedRequests: false, // Count failed requests too
    message: {
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.',
      retryAfter: 60
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.',
        retryAfter: 60
      });
    },
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    }
  }),
  refreshRateLimiter: rateLimit({
    store,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Max 10 refresh attempts per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Trop de tentatives de rafraîchissement. Veuillez réessayer dans 1 minute.',
      retryAfter: 60
    },
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: 'Trop de tentatives de rafraîchissement. Veuillez réessayer dans 1 minute.',
        retryAfter: 60
      });
    }
  }),
  passwordChangeRateLimiter: rateLimit({
    store,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Max 3 password changes per 15 minutes
    message: {
      success: false,
      error: 'Trop de tentatives de changement de mot de passe. Veuillez réessayer plus tard.',
      retryAfter: 900
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Trop de tentatives de changement de mot de passe. Veuillez réessayer dans 15 minutes.',
        retryAfter: 900
      });
    }
  }),

/**
 * Stricter rate limiter for password change attempts
 * Limits password change attempts to prevent abuse
 */
  apiRateLimiter: rateLimit({
    store,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Relax in dev, keep strict in production
    standardHeaders: true,
    legacyHeaders: false,
    // Optional bypass for local debugging only (must be explicitly enabled)
    skip: (req) => {
      if (req.method === 'OPTIONS') {
        return true;
      }

      if (req.path === '/health') {
        return true;
      }

      return process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_DISABLE_IN_DEV === 'true';
    },
    message: {
      success: false,
      error: 'Trop de requêtes. Veuillez réessayer plus tard.'
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: 900
      });
    }
  })
});

/**
 * Graceful shutdown handler for Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing Redis');
    }
  }
};
