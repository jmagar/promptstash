import { logRequest, recordHttpRequest } from '@workspace/observability';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to track API response times and log performance metrics
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response time
  res.end = function (chunk?: unknown, encoding?: unknown, callback?: unknown): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Get user ID if authenticated
    const userId = req.user?.id;

    // Log the request with performance data
    logRequest({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      responseTime: duration,
      requestId: req.requestId,
      userId,
    });

    // Record metrics for Prometheus
    recordHttpRequest({
      method: req.method,
      route: req.route?.path || req.path || 'unknown',
      statusCode,
      duration,
    });

    // Call original end function
    if (typeof chunk === 'function') {
      return originalEnd.call(this, chunk);
    } else if (typeof encoding === 'function') {
      return originalEnd.call(this, chunk as unknown as string, encoding);
    } else {
      return originalEnd.call(
        this,
        chunk as unknown as string,
        encoding as BufferEncoding,
        callback as () => void,
      );
    }
  };

  next();
};

/**
 * Middleware to track slow requests (over threshold)
 * Useful for identifying performance bottlenecks
 */
export function createSlowRequestMiddleware(thresholdMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > thresholdMs) {
        console.warn({
          type: 'slow_request',
          method: req.method,
          url: req.originalUrl || req.url,
          duration,
          threshold: thresholdMs,
          requestId: req.requestId,
        });
      }
    });

    next();
  };
}
