import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// `serverEnv` caches its result, so each case gets a fresh module instance.
async function load() {
  vi.resetModules();
  return import("./env");
}

describe("serverEnv", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("treats blank variables as unset instead of failing the whole parse", async () => {
    // The .env.example template leaves unused backends as `NAME=`. Those used
    // to fail z.url()/z.email() and drop every *valid* key to defaults.
    vi.stubEnv("LEAD_WEBHOOK_URL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("WEB3FORMS_ACCESS_KEY", "aa804ffc-test");

    const { serverEnv, hasLeadDelivery } = await load();
    expect(serverEnv().WEB3FORMS_ACCESS_KEY).toBe("aa804ffc-test");
    expect(serverEnv().LEAD_WEBHOOK_URL).toBeUndefined();
    expect(hasLeadDelivery()).toBe(true);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("reports no delivery when every backend is blank", async () => {
    vi.stubEnv("WEB3FORMS_ACCESS_KEY", "");
    vi.stubEnv("LEAD_WEBHOOK_URL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const { hasLeadDelivery } = await load();
    expect(hasLeadDelivery()).toBe(false);
  });

  it("still falls back to defaults on a genuinely invalid value", async () => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "not a url");
    vi.stubEnv("WEB3FORMS_ACCESS_KEY", "aa804ffc-test");
    const { serverEnv } = await load();
    expect(serverEnv().LEAD_WEBHOOK_URL).toBeUndefined();
    expect(console.error).toHaveBeenCalledOnce();
  });
});
