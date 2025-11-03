import { httpRequestErrors, logError } from '@workspace/observability';
import { NextFunction, Request, Response } from 'express';

/**
 * Custom error class with status code
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Global error handling middleware
 * Logs errors with full context and returns appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  // Determine status code
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const errorCode = err instanceof HttpError ? err.code : undefined;

  // Log error with full context
  logError(err, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Record error metric
  httpRequestErrors.inc({
    method: req.method,
    route: req.route?.path || req.path || 'unknown',
    error_type: err.name,
  });

  // Prepare error response
  const isProd = process.env.NODE_ENV === 'production';
  const errorResponse: {
    error: string;
    message: string;
    code?: string;
    requestId?: string;
    stack?: string;
  } = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: err.message,
    code: errorCode,
    requestId: req.requestId,
  };

  // Include stack trace in development
  if (!isProd) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
