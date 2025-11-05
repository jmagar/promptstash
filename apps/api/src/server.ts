import { db } from '@workspace/db';
import {
  createDatabaseHealthCheck,
  createDefaultHealthCheckManager,
  getMetrics,
  initializeMetrics,
  logger,
} from '@workspace/observability';
import { formatDuration } from '@workspace/utils/helpers';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, json, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import corsOptions from './config/corsOptions';
import { swaggerSpec } from './config/swagger';
import { getSession } from './middleware/auth';
import { etag } from './middleware/cache';
import credentials from './middleware/credentials';
import { csrfErrorHandler, csrfTokenHandler } from './middleware/csrf';
import { errorHandler } from './middleware/error';
import { performanceMiddleware } from './middleware/performance';
import { requestIdMiddleware } from './middleware/request-id';
import { sanitizeInput } from './middleware/validation';
import routes from './routes';

const isProd = process.env.NODE_ENV === 'production';

// Initialize metrics collection
initializeMetrics({
  prefix: 'api_',
  collectInterval: 10000,
});

// Initialize health check manager
const healthCheckManager = createDefaultHealthCheckManager();

// Register database health check
healthCheckManager.registerCheck(
  'database',
  createDatabaseHealthCheck(async () => {
    await db.$queryRaw`SELECT 1`;
  }),
);

export const createServer = (): Express => {
  const app = express();

  // Security headers with enhanced CSP
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      hsts: isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // Request ID tracking (must come early for logging)
  app.use(requestIdMiddleware);

  // Performance monitoring (tracks response times)
  app.use(performanceMiddleware);

  // Logging
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Compression - gzip/deflate responses
  app.use(
    compression({
      // Only compress responses > 1KB
      threshold: 1024,
      // Compression level (0-9, 6 is default, good balance)
      level: 6,
      // Filter function to determine what to compress
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Fallback to standard compression filter
        return compression.filter(req, res);
      },
    }),
  );

  // Cookie parsing (required for CSRF)
  app.use(cookieParser());

  // Body parsing with size limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Input sanitization - remove dangerous characters
  app.use(sanitizeInput);

  // Apply credentials middleware before CORS middleware
  app.use(credentials);

  // CORS
  app.use(cors(corsOptions));

  // Session extraction - makes req.user available to all routes
  app.use(getSession);

  // ETag support for conditional requests and caching
  app.use(etag);

  // CSRF token endpoint (GET request, no CSRF protection needed)
  app.get('/api/csrf-token', csrfTokenHandler);

  // Liveness probe - simple check if process is running
  app.get('/health/live', async (_, res) => {
    try {
      const result = await healthCheckManager.liveness();
      res.status(200).json(result);
    } catch (error) {
      logger.error({ err: error }, 'Liveness check failed');
      res.status(500).json({ status: 'fail' });
    }
  });

  // Readiness probe - comprehensive health checks
  app.get('/health/ready', async (_, res) => {
    try {
      const result = await healthCheckManager.readiness();
      const statusCode =
        result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(result);
    } catch (error) {
      logger.error({ err: error }, 'Readiness check failed');
      res.status(503).json({
        status: 'unhealthy',
        checks: {},
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      });
    }
  });

  // Legacy health check route (for backwards compatibility)
  app.get('/health', async (_, res) => {
    try {
      const result = await healthCheckManager.readiness();
      const uptimeInSeconds = process.uptime();
      const uptime = formatDuration({ seconds: Math.floor(uptimeInSeconds) });

      res.status(result.status === 'unhealthy' ? 503 : 200).json({
        ok: result.status !== 'unhealthy',
        status: result.status,
        uptime,
        timestamp: new Date().toISOString(),
        checks: result.checks,
      });
    } catch (error) {
      logger.error({ err: error }, 'Health check failed');
      res.status(503).json({
        ok: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (_, res) => {
    try {
      const metrics = await getMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.send(metrics);
    } catch (error) {
      logger.error({ err: error }, 'Failed to generate metrics');
      res.status(500).json({ error: 'Failed to generate metrics' });
    }
  });

  // API Documentation
  app.use('/api-docs', swaggerUi.serve);
  app.get(
    '/api-docs',
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'PromptStash API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );

  // API Routes with CSRF protection for state-changing operations
  // TEMPORARILY DISABLED for debugging - TODO: re-enable after fixing cookie issues
  // app.use('/api', csrfProtection, routes);
  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
  });

  // CSRF error handler (must come before general error handler)
  app.use(csrfErrorHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};
