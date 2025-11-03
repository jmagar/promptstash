import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  register,
  Registry,
} from "prom-client";

/**
 * Metrics registry singleton
 */
export const metricsRegistry: Registry = register;

/**
 * Initialize default metrics collection (CPU, memory, event loop, etc.)
 */
export function initializeMetrics(
  config: { prefix?: string; collectInterval?: number } = {},
) {
  const { prefix = "app_", collectInterval = 10000 } = config;

  // Collect default metrics every 10 seconds
  collectDefaultMetrics({
    prefix,
    register: metricsRegistry,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    eventLoopMonitoringPrecision: collectInterval,
  });
}

/**
 * HTTP request metrics
 */
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

export const httpRequestErrors = new Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "error_type"],
  registers: [metricsRegistry],
});

/**
 * Database query metrics
 */
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "model"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const dbQueryTotal = new Counter({
  name: "db_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "model"],
  registers: [metricsRegistry],
});

export const dbQueryErrors = new Counter({
  name: "db_query_errors_total",
  help: "Total number of database query errors",
  labelNames: ["operation", "model", "error_type"],
  registers: [metricsRegistry],
});

/**
 * Authentication metrics
 */
export const authAttempts = new Counter({
  name: "auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["type", "status"],
  registers: [metricsRegistry],
});

/**
 * Rate limit metrics
 */
export const rateLimitHits = new Counter({
  name: "rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["endpoint", "identifier_type"],
  registers: [metricsRegistry],
});

/**
 * Business metrics
 */
export const activeUsers = new Counter({
  name: "active_users_total",
  help: "Total number of active users",
  labelNames: ["action"],
  registers: [metricsRegistry],
});

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  metricsRegistry.clear();
}

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(params: {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  error?: Error;
}) {
  const { method, route, statusCode, duration, error } = params;

  // Record duration
  httpRequestDuration.observe(
    {
      method,
      route,
      status_code: statusCode,
    },
    duration / 1000, // Convert to seconds
  );

  // Record total requests
  httpRequestTotal.inc({
    method,
    route,
    status_code: statusCode,
  });

  // Record errors
  if (error) {
    httpRequestErrors.inc({
      method,
      route,
      error_type: error.name,
    });
  }
}

/**
 * Record database query metrics
 */
export function recordDbQuery(params: {
  operation: string;
  model: string;
  duration: number;
  error?: Error;
}) {
  const { operation, model, duration, error } = params;

  // Record duration
  dbQueryDuration.observe(
    {
      operation,
      model,
    },
    duration / 1000, // Convert to seconds
  );

  // Record total queries
  dbQueryTotal.inc({
    operation,
    model,
  });

  // Record errors
  if (error) {
    dbQueryErrors.inc({
      operation,
      model,
      error_type: error.name,
    });
  }
}
