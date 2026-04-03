// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';


export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Comprehensive error handler middleware
 * Catches all errors and returns formatted responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  logger.error({
    path: req.path,
    method: req.method,
    status,
    message: err.message,
    code: err.code,
  }, 'Unhandled error');

  // Express-validator errors
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: err.array().map((e: any) => ({
        field: e.param,
        message: e.msg,
        value: isDevelopment ? e.value : undefined
      }))
    });
  }

  // Prisma database errors
  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          error: 'Ressource non trouvée',
          code: 'NOT_FOUND'
        });

      case 'P2002':
        // Unique constraint violation
        const field = err.meta?.target?.[0] || 'unknown';
        return res.status(409).json({
          success: false,
          error: `Valeur '${field}' déjà utilisée`,
          code: 'DUPLICATE_ENTRY',
          field
        });

      case 'P2003':
        // Foreign key constraint
        return res.status(400).json({
          success: false,
          error: 'Référence invalide',
          code: 'INVALID_REFERENCE'
        });

      case 'P2014':
        // Required relation violation
        return res.status(400).json({
          success: false,
          error: 'Relation requise manquante',
          code: 'MISSING_RELATION'
        });

      default:
        return res.status(500).json({
          success: false,
          error: 'Erreur base de données',
          code: err.code
        });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expiré',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter || 60
    });
  }

  // Authentication errors
  if (status === 401) {
    return res.status(401).json({
      success: false,
      error: err.message || 'Non authentifié',
      code: 'UNAUTHORIZED'
    });
  }

  // Authorization errors
  if (status === 403) {
    return res.status(403).json({
      success: false,
      error: err.message || 'Accès refusé',
      code: 'FORBIDDEN'
    });
  }

  // Default error response
  return res.status(status).json({
    success: false,
    error: isDevelopment ? err.message : 'Erreur serveur interne',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * Async error wrapper for route handlers
 * Wraps async functions and passes errors to error handler
 */
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for API errors
 */
export class CustomError extends Error implements ApiError {
  status: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    status = 500,
    code = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'CustomError';
  }
}

/**
 * Error factory functions
 */
export const errors = {
  notFound: (resource: string) => 
    new CustomError(`${resource} non trouvé`, 404, 'NOT_FOUND'),

  unauthorized: (message = 'Non authentifié') => 
    new CustomError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Accès refusé') => 
    new CustomError(message, 403, 'FORBIDDEN'),

  conflict: (message: string) => 
    new CustomError(message, 409, 'CONFLICT'),

  validation: (message: string, details?: Record<string, any>) => 
    new CustomError(message, 400, 'VALIDATION_ERROR', details),

  internal: (message: string) => 
    new CustomError(message, 500, 'INTERNAL_ERROR')
};
