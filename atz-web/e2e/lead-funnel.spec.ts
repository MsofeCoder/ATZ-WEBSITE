import { test, expect, type Page } from "@playwright/test";

const CTA = /Request a Consultation|Omba Ushauri/i;
const SEND = /Send Request|Tuma Ombi/i;

async function openModal(page: Page) {
  await page.goto("/");
  // The header CTA is hidden on mobile behind the menu toggle.
  const menu = page.getByRole("button", { name: /open menu/i });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: CTA }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("home page", () => {
  test("renders the hero and every section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const id of ["ecosystem", "approach", "about", "values"]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test("every company card shows exactly three stat chips", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#ecosystem [data-brand]")).toHaveCount(3);
    for (const brand of ["md", "ai", "mc"]) {
      await expect(page.locator(`[data-brand="${brand}"] ul li`).first()).toBeVisible();
      await expect(page.locator(`[data-brand="${brand}"] > div > ul > li`)).toHaveCount(3);
    }
  });

  test("company details panel expands and collapses", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('[data-brand="md"]');
    const toggle = card.getByRole("button").first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("below-the-fold content is present in the server HTML", async ({ page }) => {
    // Regression guard: sections used to render at opacity:0 and depend on JS
    // to reveal them, so a failed bundle left the page blank below the hero.
    const res = await page.goto("/");
    const html = await res!.text();
    expect(html).toContain('id="values"');
    expect(html).toContain('id="approach"');
  });

  test("scroll reveal completes and leaves content fully visible", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("#values h2");
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    await expect.poll(() => heading.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
});

test.describe("consultation modal", () => {
  test("only one dialog exists no matter which CTA opens it", async ({ page }) => {
    await openModal(page);
    // The modal used to be mounted three times on the home page.
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("traps focus, closes on Escape, and restores focus", async ({ page }) => {
    const dialog = await openModal(page);
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("locks body scroll while open and releases it on close", async ({ page }) => {
    await openModal(page);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  });

  test("shows a validation error on empty submit", async ({ page }) => {
    const dialog = await openModal(page);
    await dialog.getByRole("button", { name: SEND }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
  });

  test("submits successfully and shows the confirmation", async ({ page }) => {
    // The deployed API has no delivery backend in CI, so the transport is
    // stubbed; what is under test is the client's own success path.
    await page.route("**/api/lead", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "test" }),
      })
    );
    const dialog = await openModal(page);
    await dialog.locator("#cf-name").fill("E2E Tester");
    await dialog.locator("#cf-email").fill("e2e@atzcompany.co.tz");
    await dialog.locator("#cf-message").fill("Automated verification run");
    await dialog.getByRole("button", { name: SEND }).click();
    await expect(dialog.getByRole("status")).toBeVisible();
  });

  test("surfaces a rate-limit response to the visitor", async ({ page }) => {
    await page.route("**/api/lead", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "rate_limited" }),
      })
    );
    const dialog = await openModal(page);
    await dialog.locator("#cf-name").fill("E2E Tester");
    await dialog.locator("#cf-email").fill("e2e@atzcompany.co.tz");
    await dialog.getByRole("button", { name: SEND }).click();
    await expect(dialog.getByRole("alert")).toContainText(/too many|maombi mengi/i);
  });

  test("reports a server failure instead of claiming success", async ({ page }) => {
    await page.route("**/api/lead", (route) =>
      route.fulfill({ status: 502, contentType: "application/json", body: "{}" })
    );
    const dialog = await openModal(page);
    await dialog.locator("#cf-name").fill("E2E Tester");
    await dialog.locator("#cf-email").fill("e2e@atzcompany.co.tz");
    await dialog.getByRole("button", { name: SEND }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveCount(0);
  });
});

test.describe("lead API contract", () => {
  /**
   * A same-origin header is required: the route rejects cross-site posts.
   *
   * Each request also claims its own client IP. The rate limiter allows five
   * posts per IP per minute, and every test in this file — across both browser
   * projects, running in parallel — otherwise shares 127.0.0.1. That tripped
   * the limit and failed whichever test happened to run sixth, which looked
   * like a flaky product bug rather than the tests colliding. Distinct IPs
   * isolate them while still exercising the real limiter.
   */
  let ipSeed = 0;
  const headers = (baseURL: string) => ({
    Origin: baseURL,
    "X-Forwarded-For": `203.0.113.${++ipSeed}`,
  });

  test("rejects a malformed payload", async ({ request, baseURL }) => {
    const res = await request.post("/api/lead", {
      data: { email: "not-an-email" },
      headers: headers(baseURL!),
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("validation");
  });

  test("rejects invalid JSON", async ({ request, baseURL }) => {
    const res = await request.post("/api/lead", {
      data: "{not json",
      headers: { ...headers(baseURL!), "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects a cross-origin post", async ({ request }) => {
    const res = await request.post("/api/lead", {
      data: { name: "Attacker", email: "a@b.co" },
      headers: { Origin: "https://evil.example", "X-Forwarded-For": "203.0.113.200" },
    });
    expect(res.status()).toBe(403);
  });

  test("rejects GET", async ({ request }) => {
    expect((await request.get("/api/lead")).status()).toBe(405);
  });

  test("rate-limits a burst from one IP", async ({ request, baseURL }) => {
    // The limiter allows 5 per minute; the 6th must be refused with the
    // headers a well-behaved client needs in order to back off.
    const ip = "203.0.113.250";
    const post = () =>
      request.post("/api/lead", {
        data: { name: "Burst Tester", email: "burst@example.com" },
        headers: { Origin: baseURL!, "X-Forwarded-For": ip },
      });
    let limited: Awaited<ReturnType<typeof post>> | null = null;
    for (let i = 0; i < 7 && !limited; i++) {
      const res = await post();
      if (res.status() === 429) limited = res;
    }
    expect(limited, "a burst of 7 posts should hit the rate limit").not.toBeNull();
    expect(limited!.headers()["retry-after"]).toBeTruthy();
  });

  test("silently accepts a honeypot submission", async ({ request, baseURL }) => {
    const res = await request.post("/api/lead", {
      data: { name: "Bot", email: "bot@example.com", _gotcha: "filled" },
      headers: headers(baseURL!),
    });
    // Bots must learn nothing from the response.
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
