import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { errorResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response => {
  logger.error(`Error processing ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.message, err.errors);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return errorResponse(res, 400, 'Validation Error', formattedErrors);
  }

  // Handle Prisma Known Request Errors safely
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return errorResponse(res, 409, 'Unique constraint violation. Entity already exists.');
    }
    if (err.code === 'P2025') {
      return errorResponse(res, 404, 'Requested entity record not found.');
    }
    return errorResponse(res, 400, 'Database operation failed', err.meta || err.message);
  }

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Unknown error occurred';
  const errorPayload = env.NODE_ENV === 'production' ? undefined : { stack: err.stack };

  return errorResponse(res, 500, message, errorPayload);
};
