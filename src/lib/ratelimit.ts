// TODO: Replace with a Redis-backed rate limiter (e.g. @upstash/ratelimit + @upstash/redis).
// In-memory rate limiting does not work on serverless — each cold start resets the counter
// and concurrent instances share no state. Until a Redis store is wired up, the limiters
// below are no-ops that log a warning so the call sites continue to work unchanged.

interface RatelimitResult {
  success: boolean
}

interface Ratelimiter {
  limit(identifier: string): Promise<RatelimitResult>
}

function noopLimiter(name: string): Ratelimiter {
  return {
    limit(identifier: string): Promise<RatelimitResult> {
      console.warn(
        `[ratelimit] No-op rate limiter "${name}" called for: ${identifier}` +
        ' — not effective on serverless. Wire up @upstash/ratelimit to enforce limits.',
      )
      return Promise.resolve({ success: true })
    },
  }
}

// 5 intentos por IP por hora (no-op until Redis is configured)
export const registrationLimiter: Ratelimiter = noopLimiter('registrationLimiter')

// 100 creaciones por admin por hora (no-op until Redis is configured)
export const adminAffiliateLimiter: Ratelimiter = noopLimiter('adminAffiliateLimiter')
