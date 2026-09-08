import { describe, it, expect, afterEach } from "vitest";
import robots from "./robots";

/**
 * The failure this guards against is silent.
 *
 * Indexability used to be gated on `VERCEL_ENV === "production"`. That
 * variable exists only on Vercel, so every other production host served
 * `Disallow: /` for the whole site — nothing threw, nothing logged, and the
 * only symptom would have been traffic disappearing weeks later. The existing
 * e2e test asserted that /robots.txt returns 200, which it does either way.
 */
const original = process.env.VERCEL_ENV;

afterEach(() => {
  if (original === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = original;
});

const rules = () => {
  const r = robots().rules;
  return Array.isArray(r) ? r[0]! : r;
};

describe("robots", () => {
  it("allows indexing on Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    expect(rules().allow).toBe("/");
    expect(robots().sitemap).toContain("/sitemap.xml");
  });

  it("allows indexing on a self-hosted production host", () => {
    // The regression case: no VERCEL_ENV at all.
    delete process.env.VERCEL_ENV;
    expect(rules().allow).toBe("/");
    expect(rules().disallow).toEqual(["/api/"]);
  });

  it.each(["preview", "development"])("blocks indexing on a Vercel %s deployment", (env) => {
    process.env.VERCEL_ENV = env;
    expect(rules().disallow).toBe("/");
    expect(rules().allow).toBeUndefined();
  });

  it("keeps the API out of the index wherever it is indexable", () => {
    process.env.VERCEL_ENV = "production";
    expect(rules().disallow).toEqual(["/api/"]);
  });
});
