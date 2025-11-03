import { logger } from "./logger";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, CheckResult>;
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface CheckResult {
  status: "pass" | "fail" | "warn";
  message?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export type HealthCheck = () => Promise<CheckResult>;

/**
 * Health check manager for coordinating multiple health checks
 */
export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private startTime: number = Date.now();

  /**
   * Register a health check
   * @param name - Name of the health check
   * @param check - Health check function
   */
  registerCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  /**
   * Run all registered health checks
   * @returns Aggregated health check results
   */
  async runChecks(): Promise<HealthCheckResult> {
    const results: Record<string, CheckResult> = {};
    const checkPromises: Promise<void>[] = [];

    // Run all checks in parallel
    for (const [name, check] of this.checks) {
      checkPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const result = await check();
            results[name] = {
              ...result,
              duration: Date.now() - start,
            };
          } catch (error) {
            logger.error(
              { err: error, check: name },
              `Health check failed: ${name}`,
            );
            results[name] = {
              status: "fail",
              message: error instanceof Error ? error.message : "Unknown error",
              duration: Date.now() - start,
            };
          }
        })(),
      );
    }

    await Promise.all(checkPromises);

    // Determine overall status
    const statuses = Object.values(results).map((r) => r.status);
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (statuses.includes("fail")) {
      overallStatus = "unhealthy";
    } else if (statuses.includes("warn")) {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version,
    };
  }

  /**
   * Get liveness probe (simple check if process is running)
   * @returns Liveness result
   */
  async liveness(): Promise<{ status: "pass" }> {
    return { status: "pass" };
  }

  /**
   * Get readiness probe (checks if service is ready to accept traffic)
   * @returns Readiness result
   */
  async readiness(): Promise<HealthCheckResult> {
    return this.runChecks();
  }
}

/**
 * Database health check factory
 * @param checkFn - Function that performs database connectivity check
 * @returns Health check function
 */
export function createDatabaseHealthCheck(
  checkFn: () => Promise<void>,
): HealthCheck {
  return async (): Promise<CheckResult> => {
    try {
      await checkFn();
      return {
        status: "pass",
        message: "Database connection is healthy",
      };
    } catch (error) {
      logger.error({ err: error }, "Database health check failed");
      return {
        status: "fail",
        message:
          error instanceof Error ? error.message : "Database connection failed",
      };
    }
  };
}

/**
 * Memory health check
 * @param thresholdPercent - Memory usage threshold percentage (0-100)
 * @returns Health check function
 */
export function createMemoryHealthCheck(
  thresholdPercent: number = 90,
): HealthCheck {
  return async (): Promise<CheckResult> => {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const usagePercent = (usedMemory / totalMemory) * 100;

    const metadata = {
      heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
      heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
      usagePercent: Math.round(usagePercent),
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };

    if (usagePercent > thresholdPercent) {
      return {
        status: "warn",
        message: `Memory usage is ${Math.round(usagePercent)}% (threshold: ${thresholdPercent}%)`,
        metadata,
      };
    }

    return {
      status: "pass",
      message: `Memory usage is ${Math.round(usagePercent)}%`,
      metadata,
    };
  };
}

/**
 * Disk space health check
 * @param path - Path to check disk space
 * @param thresholdPercent - Disk usage threshold percentage (0-100)
 * @returns Health check function
 */
export function createDiskHealthCheck(
  path: string = "/",
  thresholdPercent: number = 90,
): HealthCheck {
  return async (): Promise<CheckResult> => {
    // Note: This is a placeholder. In a real implementation, you'd use a library
    // like 'check-disk-space' to get actual disk usage metrics
    return {
      status: "pass",
      message: "Disk space check not implemented",
      metadata: {
        path,
        thresholdPercent,
      },
    };
  };
}

/**
 * Redis/Cache health check factory
 * @param checkFn - Function that performs cache connectivity check
 * @returns Health check function
 */
export function createCacheHealthCheck(
  checkFn: () => Promise<void>,
): HealthCheck {
  return async (): Promise<CheckResult> => {
    try {
      await checkFn();
      return {
        status: "pass",
        message: "Cache connection is healthy",
      };
    } catch (error) {
      logger.warn({ err: error }, "Cache health check failed");
      // Cache failures are often not critical, so return 'warn' instead of 'fail'
      return {
        status: "warn",
        message:
          error instanceof Error ? error.message : "Cache connection degraded",
      };
    }
  };
}

/**
 * Create a default health check manager with common checks
 */
export function createDefaultHealthCheckManager(): HealthCheckManager {
  const manager = new HealthCheckManager();

  // Add memory check by default
  manager.registerCheck("memory", createMemoryHealthCheck(90));

  return manager;
}
