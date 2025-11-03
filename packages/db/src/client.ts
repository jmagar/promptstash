import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma logging based on environment
const logLevel = process.env.LOG_LEVEL || 'info';
const enableQueryLogging = process.env.ENABLE_QUERY_LOGGING === 'true';
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);

// Create Prisma client with logging configuration
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      enableQueryLogging || logLevel === 'debug'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
  });

// Log slow queries if query logging is enabled
if (enableQueryLogging || logLevel === 'debug') {
  prisma.$on('query', (e: { query: string; params: string; duration: number; target: string }) => {
    const isSlow = e.duration > slowQueryThreshold;

    // Only log slow queries or when in debug mode
    if (isSlow || logLevel === 'debug') {
      const logData = {
        type: 'database',
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
        slow: isSlow,
      };

      if (isSlow) {
        console.warn(
          JSON.stringify({
            ...logData,
            level: 'warn',
            message: `Slow query detected (${e.duration}ms)`,
          }),
        );
      } else {
        console.debug(
          JSON.stringify({
            ...logData,
            level: 'debug',
            message: `Query executed (${e.duration}ms)`,
          }),
        );
      }
    }
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
