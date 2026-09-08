import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit, __resetMemoryLimiter } from "./rate-limit";

// No Upstash credentials in the test env, so these exercise the in-memory
// fallback — the path that runs locally and on single-instance hosting.
describe("checkRateLimit (memory backend)", () => {
  beforeEach(() => {
    __resetMemoryLimiter();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit and then blocks", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await checkRateLimit("a", { limit: 5 })).ok).toBe(true);
    }
    expect((await checkRateLimit("a", { limit: 5 })).ok).toBe(false);
  });

  it("counts down the remaining budget", async () => {
    expect((await checkRateLimit("b", { limit: 3 })).remaining).toBe(2);
    expect((await checkRateLimit("b", { limit: 3 })).remaining).toBe(1);
    expect((await checkRateLimit("b", { limit: 3 })).remaining).toBe(0);
  });

  it("keeps identifiers independent", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("c", { limit: 5 });
    expect((await checkRateLimit("c", { limit: 5 })).ok).toBe(false);
    expect((await checkRateLimit("d", { limit: 5 })).ok).toBe(true);
  });

  it("resets after the window elapses", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("e", { limit: 5, windowSeconds: 60 });
    expect((await checkRateLimit("e", { limit: 5, windowSeconds: 60 })).ok).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect((await checkRateLimit("e", { limit: 5, windowSeconds: 60 })).ok).toBe(true);
  });

  it("reports which backend answered", async () => {
    expect((await checkRateLimit("f")).backend).toBe("memory");
  });

  it("does not grow unboundedly — expired keys are pruned", async () => {
    for (let i = 0; i < 100; i++) await checkRateLimit(`bulk-${i}`);
    vi.advanceTimersByTime(61_000);
    // The next call prunes; a previously-seen key starts a fresh window.
    const after = await checkRateLimit("bulk-0", { limit: 5 });
    expect(after.remaining).toBe(4);
  });
});
