import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Returns null when Upstash env vars are not configured (e.g. local dev).
// Callers must check for null and skip rate limiting gracefully.
function createLimiter(
  requests: number,
  window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`,
  prefix: string,
): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  })
}

// Self-registration: 5 attempts per IP per hour
export const registrationLimiter = createLimiter(5, '1 h', 'nexo:reg')

// Admin affiliate creation: 100 per admin email per hour
export const adminAffiliateLimiter = createLimiter(100, '1 h', 'nexo:admin')
