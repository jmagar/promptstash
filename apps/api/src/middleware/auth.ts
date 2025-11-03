import { auth, fromNodeHeaders } from '@workspace/auth';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to get the session from Better Auth and attach it to the request object.
 * This middleware extracts the session from cookies/headers and makes it available
 * on req.session and req.user for subsequent middleware and route handlers.
 */
export function getSession(req: Request, res: Response, next: NextFunction): void {
  auth.api
    .getSession({
      headers: fromNodeHeaders(req.headers),
    })
    .then((session) => {
      // Attach session and user to request object
      req.session = session;
      req.user = session?.user || null;
      next();
    })
    .catch((error) => {
      console.error('Error getting session:', error);
      req.session = null;
      req.user = null;
      next();
    });
}

/**
 * Middleware to require authentication.
 * Returns 401 if no valid session is found.
 * Use this middleware on routes that require authentication.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // First get the session if not already attached
  if (req.session === undefined) {
    getSession(req, res, () => {
      // After session is loaded, check auth
      if (!req.session || !req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }
      next();
    });
    return;
  }

  if (!req.session || !req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  next();
}
