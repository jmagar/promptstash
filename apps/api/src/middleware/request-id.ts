import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Extend Express Request type to include requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware to generate and attach a unique request ID to each request
 * The request ID can be used for tracing requests across services and logs
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get existing ID from header (normalize if multiple headers sent)
  const existingId = req.get('x-request-id')?.trim();

  // Generate a new UUID if no existing ID or if empty
  const requestId = existingId || randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Set response header so clients can reference this request
  res.setHeader('X-Request-ID', requestId);

  next();
};
