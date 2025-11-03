# Observability Package

Comprehensive observability toolkit for monitoring, logging, metrics, and health checks across the monorepo.

## Features

- **Structured Logging** - JSON logging with Pino for production, pretty logging for development
- **Metrics Collection** - Prometheus-compatible metrics for HTTP requests, database queries, and business events
- **Health Checks** - Liveness and readiness probes with database connectivity checks
- **Request Tracing** - Request ID tracking across services
- **Performance Monitoring** - HTTP response time tracking and slow query detection

## Installation

This package is already part of the monorepo workspace. To use it in your application:

```json
{
  "dependencies": {
    "@workspace/observability": "workspace:*"
  }
}
```

## Quick Start

### Structured Logging

```typescript
import { logger, createChildLogger, logError } from "@workspace/observability";

// Basic logging
logger.info("Server started");
logger.warn("High memory usage detected");
logger.error("Database connection failed");

// Structured logging with context
logger.info({ userId: "123", action: "login" }, "User logged in");

// Child logger with persistent context
const requestLogger = createChildLogger({ requestId: "abc-123" });
requestLogger.info("Processing request");

// Error logging with stack traces
try {
  throw new Error("Something went wrong");
} catch (error) {
  logError(error, { userId: "123", operation: "processPayment" });
}
```

### Metrics Collection

```typescript
import {
  initializeMetrics,
  recordHttpRequest,
  recordDbQuery,
  httpRequestTotal,
  getMetrics,
} from "@workspace/observability";

// Initialize metrics collection (call once at startup)
initializeMetrics({
  prefix: "api_",
  collectInterval: 10000, // 10 seconds
});

// Record HTTP request
recordHttpRequest({
  method: "GET",
  route: "/api/users",
  statusCode: 200,
  duration: 150, // milliseconds
});

// Record database query
recordDbQuery({
  operation: "findMany",
  model: "User",
  duration: 45,
});

// Custom metrics
httpRequestTotal.inc({ method: "POST", route: "/api/users", status_code: 201 });

// Export metrics (typically in /metrics endpoint)
const metrics = await getMetrics();
```

### Health Checks

```typescript
import {
  createDefaultHealthCheckManager,
  createDatabaseHealthCheck,
  createMemoryHealthCheck,
  createCacheHealthCheck,
} from "@workspace/observability";

// Create health check manager
const healthManager = createDefaultHealthCheckManager();

// Add database health check
healthManager.registerCheck(
  "database",
  createDatabaseHealthCheck(async () => {
    await db.$queryRaw`SELECT 1`;
  }),
);

// Add cache health check
healthManager.registerCheck(
  "redis",
  createCacheHealthCheck(async () => {
    await redis.ping();
  }),
);

// Add memory health check (with custom threshold)
healthManager.registerCheck("memory", createMemoryHealthCheck(85));

// Run all health checks
const result = await healthManager.readiness();
// Returns: { status: 'healthy' | 'degraded' | 'unhealthy', checks: {...}, timestamp, uptime }

// Liveness probe (simple alive check)
const liveness = await healthManager.liveness();
// Returns: { status: 'pass' }
```

## Environment Variables

Configure observability features using environment variables:

### Logging

- `LOG_LEVEL` - Log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` (default: `info`)
- `NODE_ENV` - When set to `production`, uses JSON logging; otherwise uses pretty printing

### Database Query Logging

- `ENABLE_QUERY_LOGGING` - Set to `true` to enable Prisma query logging (default: `false`)
- `SLOW_QUERY_THRESHOLD` - Threshold in milliseconds for slow query warnings (default: `1000`)

### Metrics

Metrics are automatically collected. No additional configuration required.

## API Reference

### Logger

#### `createLogger(config: LoggerConfig): Logger`

Create a new logger instance.

**Parameters:**

- `config.level` - Log level (default: `'info'`)
- `config.service` - Service name for context (default: `'unknown'`)
- `config.pretty` - Enable pretty printing (default: `NODE_ENV !== 'production'`)

#### `logger: Logger`

Default logger instance.

#### `createChildLogger(context: Record<string, unknown>): Logger`

Create a child logger with additional context.

#### `logRequest(params): void`

Log HTTP request with performance data.

**Parameters:**

- `method` - HTTP method
- `url` - Request URL
- `statusCode` - Response status code
- `responseTime` - Response time in milliseconds
- `requestId` - Request ID (optional)
- `userId` - User ID (optional)
- `error` - Error object (optional)

#### `logQuery(params): void`

Log database query with performance data.

**Parameters:**

- `query` - SQL query or operation
- `duration` - Query duration in milliseconds
- `operation` - Operation name (optional)
- `model` - Database model name (optional)
- `slow` - Mark as slow query (optional, auto-detected if > 1s)

#### `logError(error: Error, context?: Record<string, unknown>): void`

Log error with full context and stack trace.

### Metrics

#### `initializeMetrics(config): void`

Initialize default metrics collection (CPU, memory, event loop).

**Parameters:**

- `config.prefix` - Metric name prefix (default: `'app_'`)
- `config.collectInterval` - Collection interval in milliseconds (default: `10000`)

#### Available Metrics

**HTTP Metrics:**

- `httpRequestDuration` - Histogram of request durations
- `httpRequestTotal` - Counter of total requests
- `httpRequestErrors` - Counter of request errors

**Database Metrics:**

- `dbQueryDuration` - Histogram of query durations
- `dbQueryTotal` - Counter of total queries
- `dbQueryErrors` - Counter of query errors

**Business Metrics:**

- `authAttempts` - Counter of authentication attempts
- `rateLimitHits` - Counter of rate limit hits
- `activeUsers` - Counter of active users

#### `recordHttpRequest(params): void`

Record HTTP request metrics.

#### `recordDbQuery(params): void`

Record database query metrics.

#### `getMetrics(): Promise<string>`

Get all metrics in Prometheus format.

### Health Checks

#### `HealthCheckManager`

Manages and orchestrates health checks.

**Methods:**

- `registerCheck(name: string, check: HealthCheck)` - Register a health check
- `runChecks(): Promise<HealthCheckResult>` - Run all health checks
- `liveness(): Promise<{ status: 'pass' }>` - Simple liveness check
- `readiness(): Promise<HealthCheckResult>` - Comprehensive readiness check

#### `createDatabaseHealthCheck(checkFn: () => Promise<void>): HealthCheck`

Create a database connectivity health check.

#### `createMemoryHealthCheck(thresholdPercent: number): HealthCheck`

Create a memory usage health check (default threshold: 90%).

#### `createCacheHealthCheck(checkFn: () => Promise<void>): HealthCheck`

Create a cache connectivity health check (non-critical, returns 'warn' on failure).

#### `createDefaultHealthCheckManager(): HealthCheckManager`

Create a health check manager with memory check pre-registered.

## Integration Examples

### Express.js Server

```typescript
import express from "express";
import {
  logger,
  initializeMetrics,
  getMetrics,
  createDefaultHealthCheckManager,
  createDatabaseHealthCheck,
} from "@workspace/observability";
import { db } from "@workspace/db";

const app = express();

// Initialize metrics
initializeMetrics({ prefix: "api_" });

// Create health check manager
const healthManager = createDefaultHealthCheckManager();
healthManager.registerCheck(
  "database",
  createDatabaseHealthCheck(async () => {
    await db.$queryRaw`SELECT 1`;
  }),
);

// Health check endpoints
app.get("/health/live", async (_, res) => {
  const result = await healthManager.liveness();
  res.json(result);
});

app.get("/health/ready", async (_, res) => {
  const result = await healthManager.readiness();
  const statusCode = result.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(result);
});

// Metrics endpoint
app.get("/metrics", async (_, res) => {
  const metrics = await getMetrics();
  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(metrics);
});

app.listen(4000, () => {
  logger.info({ port: 4000 }, "Server started");
});
```

### Next.js API Route

```typescript
import { logger } from "@workspace/observability";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  logger.info({ path: request.nextUrl.pathname }, "API route called");

  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch data");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
```

### Prisma Query Logging

Prisma query logging is automatically enabled when:

- `ENABLE_QUERY_LOGGING=true` is set, OR
- `LOG_LEVEL=debug` is set

Slow queries (> `SLOW_QUERY_THRESHOLD` ms) are automatically logged as warnings.

## Best Practices

1. **Log Levels**
   - `debug` - Detailed debugging information, including all queries
   - `info` - General informational messages (default)
   - `warn` - Warning messages for degraded performance or non-critical issues
   - `error` - Error messages for failures that need attention

2. **Structured Logging**
   - Always include relevant context (userId, requestId, etc.)
   - Use child loggers for request-scoped logging
   - Don't log sensitive information (passwords, tokens, PII)

3. **Metrics**
   - Use labels consistently across metrics
   - Don't use high-cardinality labels (e.g., user IDs, request IDs)
   - Keep metric names descriptive and prefixed

4. **Health Checks**
   - Liveness checks should be fast and simple
   - Readiness checks should verify all dependencies
   - Use appropriate thresholds for warnings vs failures

5. **Performance**
   - Enable query logging only in development or when debugging
   - Use appropriate log levels in production
   - Monitor slow queries and optimize them

## Troubleshooting

### Logs not appearing

Check `LOG_LEVEL` environment variable. Set to `debug` for verbose logging.

### Metrics not collected

Ensure `initializeMetrics()` is called at application startup.

### Health checks always failing

Verify database connection and other dependencies are properly configured.

### Slow queries not logged

Set `ENABLE_QUERY_LOGGING=true` or `LOG_LEVEL=debug` and ensure `SLOW_QUERY_THRESHOLD` is appropriate.

## License

Private - Part of the build-elevate monorepo.
