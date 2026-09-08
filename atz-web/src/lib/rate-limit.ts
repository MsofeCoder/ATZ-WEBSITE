/**
 * Fixed-window rate limiter.
 *
 * Uses Redis when configured, so the limit holds across serverless instances.
 * Without Redis it degrades to a per-instance in-memory window — correct for
 * local dev and single-instance hosting, and better than nothing elsewhere.
 * `check()` reports which backend answered so callers can log the difference.
 */
import { incrementWithTtl, hasRedis } from "./redis";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
  backend: "redis" | "memory";
}

const memory = new Map<string, { count: number; reset: number }>();

function memoryCheck(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  for (const [k, rec] of memory) if (now > rec.reset) memory.delete(k);
  const rec = memory.get(key);
  if (!rec || now > rec.reset) {
    memory.set(key, { count: 1, reset: now + windowMs });
    return { count: 1, reset: now + windowMs };
  }
  rec.count += 1;
  return rec;
}

export async function checkRateLimit(
  identifier: string,
  { limit = 5, windowSeconds = 60 } = {}
): Promise<RateLimitResult> {
  const key = `atz:rl:${identifier}`;

  if (hasRedis()) {
    const count = await incrementWithTtl(key, windowSeconds);
    if (count !== null) {
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        limit,
        resetSeconds: windowSeconds,
        backend: "redis",
      };
    }
    // Redis was configured but unreachable — fall through to memory.
  }

  const rec = memoryCheck(key, limit, windowSeconds * 1_000);
  return {
    ok: rec.count <= limit,
    remaining: Math.max(0, limit - rec.count),
    limit,
    resetSeconds: Math.ceil((rec.reset - Date.now()) / 1_000),
    backend: "memory",
  };
}

/** Test seam — clears the in-memory window between cases. */
export function __resetMemoryLimiter() {
  memory.clear();
}
