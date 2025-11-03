import pino, { Logger } from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerConfig {
  level?: LogLevel;
  service?: string;
  pretty?: boolean;
}

/**
 * Creates a structured logger instance using Pino
 * @param config - Logger configuration options
 * @returns Configured Pino logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const {
    level = "info",
    service = "unknown",
    pretty = process.env.NODE_ENV !== "production",
  } = config;

  const baseConfig = {
    level,
    base: {
      service,
      env: process.env.NODE_ENV || "development",
      pid: process.pid,
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
  };

  // Use pretty printing in development for better readability
  if (pretty) {
    return pino({
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          singleLine: false,
        },
      },
    });
  }

  // Use JSON logging in production for better parsing
  return pino(baseConfig);
}

/**
 * Default logger instance for general use
 */
export const logger = createLogger({
  service: "app",
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
});

/**
 * Creates a child logger with additional context
 * @param context - Context object to attach to all logs
 * @returns Child logger instance
 */
export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Log helper for HTTP requests
 */
export function logRequest(params: {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  requestId?: string;
  userId?: string;
  error?: Error;
}) {
  const { method, url, statusCode, responseTime, requestId, userId, error } =
    params;

  const logData = {
    type: "http",
    method,
    url,
    statusCode,
    responseTime,
    requestId,
    userId,
  };

  if (error) {
    logger.error(
      {
        ...logData,
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      `${method} ${url} ${statusCode} - ${responseTime}ms - ERROR: ${error.message}`,
    );
  } else if (statusCode >= 500) {
    logger.error(logData, `${method} ${url} ${statusCode} - ${responseTime}ms`);
  } else if (statusCode >= 400) {
    logger.warn(logData, `${method} ${url} ${statusCode} - ${responseTime}ms`);
  } else {
    logger.info(logData, `${method} ${url} ${statusCode} - ${responseTime}ms`);
  }
}

/**
 * Log helper for database queries
 */
export function logQuery(params: {
  query: string;
  duration: number;
  operation?: string;
  model?: string;
  slow?: boolean;
}) {
  const { query, duration, operation, model, slow } = params;

  const logData = {
    type: "database",
    query,
    duration,
    operation,
    model,
    slow: slow || duration > 1000, // Mark as slow if > 1s
  };

  if (logData.slow) {
    logger.warn(
      logData,
      `Slow database query (${duration}ms): ${operation || "unknown"}`,
    );
  } else if (process.env.LOG_LEVEL === "debug") {
    logger.debug(
      logData,
      `Database query (${duration}ms): ${operation || "unknown"}`,
    );
  }
}

/**
 * Log helper for errors with full context
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message,
  );
}
