import { doubleCsrf } from 'csrf-csrf';
import type { NextFunction, Request, Response } from 'express';

/**
 * CSRF Protection Configuration
 * Uses double-submit cookie pattern for CSRF protection
 */
const {
  generateCsrfToken, // Used to generate a CSRF token (correct function name)
  doubleCsrfProtection, // The CSRF protection middleware
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: (req) => req.session?.id || req.user?.id || 'anonymous',
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/**
 * CSRF Token Generation Endpoint Handler
 * This should be mounted on a route that generates and returns a CSRF token
 */
export const csrfTokenHandler = (req: Request, res: Response): void => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
};

/**
 * CSRF Protection Middleware
 * Apply this to routes that modify state (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Custom CSRF Error Handler
 * Provides better error messages for CSRF failures
 */
export const csrfErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err.message && err.message.includes('CSRF')) {
    res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
    });
    return;
  }
  next(err);
};
