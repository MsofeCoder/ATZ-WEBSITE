import { describe, it, expect } from "vitest";
import { MIN_FILL_MS, leadSchema, isValidEmail, EMAIL_RE } from "./validation";

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last@example.com", "user+tag@sub.domain.org"])("accepts %s", (email) =>
    expect(isValidEmail(email)).toBe(true)
  );

  it.each(["", "no-at-sign", "a@b", "a b@c.co", "@b.co", "a@.co", "two@at@signs.co"])(
    "rejects %s",
    (email) => expect(isValidEmail(email)).toBe(false)
  );

  it("is not stateful across calls (no /g flag)", () => {
    expect(EMAIL_RE.global).toBe(false);
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });
});

describe("leadSchema", () => {
  const valid = { name: "Amina", email: "amina@example.com" };

  it("accepts the minimum viable lead and fills defaults", () => {
    const parsed = leadSchema.parse(valid);
    expect(parsed.name).toBe("Amina");
    expect(parsed.company).toBe("");
    expect(parsed.locale).toBe("en");
  });

  it("trims whitespace", () => {
    const parsed = leadSchema.parse({ name: "  Amina  ", email: " a@b.co " });
    expect(parsed.name).toBe("Amina");
    expect(parsed.email).toBe("a@b.co");
  });

  it("rejects a one-character name", () => {
    expect(leadSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    expect(leadSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const res = leadSchema.safeParse({ ...valid, email: "nope" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(Object.keys(res.error.flatten().fieldErrors)).toContain("email");
    }
  });

  it("caps the message length rather than truncating silently", () => {
    const res = leadSchema.safeParse({ ...valid, message: "x".repeat(5001) });
    expect(res.success).toBe(false);
  });

  it("accepts a message at exactly the limit", () => {
    expect(leadSchema.safeParse({ ...valid, message: "x".repeat(5000) }).success).toBe(true);
  });

  it("falls back to English for an unknown locale", () => {
    expect(leadSchema.safeParse({ ...valid, locale: "fr" }).success).toBe(false);
  });

  it("keeps a supported locale", () => {
    expect(leadSchema.parse({ ...valid, locale: "sw" }).locale).toBe("sw");
  });

  it("carries the honeypot through so the route can inspect it", () => {
    expect(leadSchema.parse({ ...valid, _gotcha: "bot" })._gotcha).toBe("bot");
  });

  it("coerces the elapsed-time field", () => {
    expect(leadSchema.parse({ ...valid, _elapsed: "4200" })._elapsed).toBe(4200);
  });

  it("rejects a negative elapsed time", () => {
    // The field is a duration, not a timestamp. A negative value would mean
    // the form was submitted before it opened.
    expect(leadSchema.safeParse({ ...valid, _elapsed: -5 }).success).toBe(false);
  });

  it("is immune to client clock skew", () => {
    // The bug this replaced: the client sent an absolute Date.now() and the
    // server subtracted it from its own clock. A device running five minutes
    // fast produced a large negative difference, which fell under
    // MIN_FILL_MS, so a real enquiry was dropped as a bot behind a success
    // screen. An elapsed duration is measured on one clock and cannot skew.
    const skewedDeviceClock = Date.now() + 5 * 60_000;
    const openedAt = skewedDeviceClock;
    const submittedAt = skewedDeviceClock + 9_000; // nine seconds of typing
    const parsed = leadSchema.parse({ ...valid, _elapsed: submittedAt - openedAt });
    expect(parsed._elapsed).toBe(9_000);
    expect(parsed._elapsed!).toBeGreaterThanOrEqual(MIN_FILL_MS);
  });

  it("ignores unknown fields rather than failing", () => {
    const parsed = leadSchema.parse({ ...valid, injected: "<script>" });
    expect(parsed).not.toHaveProperty("injected");
  });
});
