/**
 * Fixed-window rate limiter, in-process memory.
 *
 * Good enough for a single-instance deploy (one Docker container, one
 * Next.js server process) which is exactly this app's target shape.
 * It resets on redeploy and doesn't share state across horizontal
 * replicas — if you scale to multiple instances behind a load balancer,
 * swap the Map below for Redis/Upstash (same interface, same call sites).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic sweep so this Map doesn't grow unbounded over a long-running
// process. Cheap: runs every 5 minutes, only touches expired entries.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  },
  5 * 60 * 1000
).unref?.();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

/**
 * @param key      Unique identifier for the caller, e.g. `login:<ip>` or
 *                 `login:<ip>:<email>`. Namespace by route so different
 *                 endpoints don't share a budget.
 * @param limit    Max requests allowed within the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort client IP extraction behind Nginx/Vercel proxies. */
export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
