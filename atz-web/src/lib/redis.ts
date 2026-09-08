/**
 * Minimal Upstash Redis REST client.
 *
 * Deliberately dependency-free: the REST API is a single POST with a JSON
 * command array, so an SDK would add weight without adding capability. Every
 * call fails soft — Redis being unreachable must never take the site down.
 */
import { serverEnv, hasRedis } from "./env";

type RedisValue = string | number;

async function command<T = unknown>(args: RedisValue[]): Promise<T | null> {
  if (!hasRedis()) return null;
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = serverEnv();
  try {
    const res = await fetch(UPSTASH_REDIS_REST_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) {
      console.error("[redis] command failed", args[0], res.status);
      return null;
    }
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) {
      console.error("[redis] error", args[0], json.error);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.error("[redis] unreachable", args[0], err);
    return null;
  }
}

/** INCR a key and set its TTL on first write. Returns the new count. */
export async function incrementWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
  const count = await command<number>(["INCR", key]);
  if (count === null) return null;
  if (count === 1) await command(["EXPIRE", key, ttlSeconds]);
  return count;
}

/** Append a JSON payload to a capped list. Returns true when it was stored. */
export async function pushCapped(key: string, payload: unknown, cap = 5_000): Promise<boolean> {
  const len = await command<number>(["LPUSH", key, JSON.stringify(payload)]);
  if (len === null) return false;
  await command(["LTRIM", key, 0, cap - 1]);
  return true;
}

export { hasRedis };
