import { Ratelimit, type RatelimitConfig } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// For local dev with dummy Redis, create a mock that always succeeds
const isDummyRedis =
  !process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL.includes('dummy');

export const redis = isDummyRedis
  ? ({
      // Mock Redis that always succeeds instantly (no network calls)
      get: async () => null,
      set: async () => 'OK',
      incr: async () => 1,
      expire: async () => 1,
      del: async () => 1,
      setex: async () => 'OK',
    } as any)
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

export const createRateLimiter = (props: Omit<RatelimitConfig, 'redis'>) =>
  new Ratelimit({
    redis,
    limiter: props.limiter ?? Ratelimit.slidingWindow(10, '10 s'),
    prefix: props.prefix ?? 'build-elevate',
  });

export const { slidingWindow } = Ratelimit;
