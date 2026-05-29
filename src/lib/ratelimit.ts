class InMemoryRatelimit {
  private store = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  limit(key: string): Promise<{ success: boolean }> {
    const now = Date.now()

    if (Math.random() < 0.01) this.cleanup(now)

    const entry = this.store.get(key)

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs })
      return Promise.resolve({ success: true })
    }

    if (entry.count >= this.max) {
      return Promise.resolve({ success: false })
    }

    entry.count++
    return Promise.resolve({ success: true })
  }

  private cleanup(now: number) {
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) this.store.delete(key)
    }
  }
}

// 5 intentos por IP por hora
export const registrationLimiter = new InMemoryRatelimit(5, 60 * 60 * 1000)

// 100 creaciones por admin por hora
export const adminAffiliateLimiter = new InMemoryRatelimit(100, 60 * 60 * 1000)
