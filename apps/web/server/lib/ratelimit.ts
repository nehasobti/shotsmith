import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback for local dev & testing without Upstash keys
const inMemoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkInMemoryLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || entry.expiresAt < now) {
    inMemoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

// 1. Image Jobs: 10 per minute per user
export async function limitJobsPerUser(userId: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:jobs',
    });
    const result = await ratelimit.limit(userId);
    return { success: result.success, limit: result.limit, remaining: result.remaining };
  }

  const allowed = checkInMemoryLimit(`jobs:${userId}`, 10, 60);
  return { success: allowed, limit: 10, remaining: allowed ? 9 : 0 };
}

// 2. Ad Copy: 5 per minute per user
export async function limitCopyPerUser(userId: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'ratelimit:copy',
    });
    const result = await ratelimit.limit(userId);
    return { success: result.success, limit: result.limit, remaining: result.remaining };
  }

  const allowed = checkInMemoryLimit(`copy:${userId}`, 5, 60);
  return { success: allowed, limit: 5, remaining: allowed ? 4 : 0 };
}

// 3. Logins: 10 per minute per IP
export async function limitLoginsPerIp(ip: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:login',
    });
    const result = await ratelimit.limit(ip);
    return { success: result.success, limit: result.limit, remaining: result.remaining };
  }

  const allowed = checkInMemoryLimit(`login:${ip}`, 10, 60);
  return { success: allowed, limit: 10, remaining: allowed ? 9 : 0 };
}
