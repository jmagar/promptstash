import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to add ETag support for GET requests
 * ETags allow clients to cache responses and make conditional requests
 */
export function etag(req: Request, res: Response, next: NextFunction) {
  // Only apply to GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to add ETag
  res.json = function (data: unknown) {
    // Generate ETag from response data
    const content = JSON.stringify(data);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const etag = `"${hash}"`;

    // Set ETag header
    res.setHeader('ETag', etag);

    // Check if client has cached version
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      // Client has fresh cache, send 304 Not Modified
      return res.status(304).end();
    }

    // Send response with ETag
    return originalJson(data);
  };

  next();
}

/**
 * Cache control middleware for different route types
 */
export const cacheControl = {
  /**
   * No cache - for frequently changing data
   */
  noCache: (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  },

  /**
   * Short cache - for data that changes occasionally (5 minutes)
   */
  short: (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
    next();
  },

  /**
   * Medium cache - for relatively stable data (1 hour)
   */
  medium: (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, max-age=3600, must-revalidate');
    next();
  },

  /**
   * Long cache - for rarely changing data (1 day)
   */
  long: (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, max-age=86400, must-revalidate');
    next();
  },
};

/**
 * Conditional request support - checks If-Modified-Since header
 */
export function conditionalGet(resourceDate: Date) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifModifiedSince = req.headers['if-modified-since'];

    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (resourceDate <= clientDate) {
        // Resource not modified since client's cached version
        return res.status(304).end();
      }
    }

    // Set Last-Modified header
    res.setHeader('Last-Modified', resourceDate.toUTCString());
    next();
  };
}
