import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/contact", "/privacy", "/terms", "/sw", "/sw/contact"];

test.describe("accessibility", () => {
  // Scroll-reveal fades sections in from opacity 0. Axe blends that against
  // the background and reports every faded element as a contrast failure, so
  // the scan runs with reduced motion: <Reveal> then leaves content alone and
  // axe measures the colours the design actually ships.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const path of PAGES) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // The canvas is decorative and aria-hidden; axe cannot inspect WebGL.
        .exclude("canvas")
        .analyze();

      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        JSON.stringify(results.violations, null, 2)
      ).toEqual([]);
    });
  }

  test("the consultation dialog is accessible when open", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("button", { name: /open menu/i });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("button", { name: /Request a Consultation/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude("canvas")
      .analyze();
    expect(
      results.violations.map((v) => v.id),
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });

  test("the skip link is the first focusable element and works", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("exactly one h1 per page", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("h1"), `on ${path}`).toHaveCount(1);
    }
  });

  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    // The entrance animation must not leave content invisible.
    const opacity = await page
      .locator(".rise")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

test.describe("SEO surface", () => {
  test("robots and sitemap respond", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    for (const path of ["/contact", "/sw/contact", "/privacy", "/sw/terms"]) {
      expect(body).toContain(path);
    }
  });

  test("home page carries Organization JSON-LD", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    const parsed = blocks.flatMap((b) => JSON.parse(b));
    expect(parsed.some((n: { "@type": string }) => n["@type"] === "Organization")).toBe(true);
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("404 page renders for an unknown route", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res!.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
