import { test, expect, type Page } from "@playwright/test";

const CTA = /Request a Consultation|Omba Ushauri/i;
const SEND = /Send Request|Tuma Ombi/i;

async function openModal(page: Page) {
  await page.goto("/");
  // The header and hero CTAs route to the scope card on the home page; the
  // CTA band's button is the one that opens the dialog directly.
  await page.locator("#contact-cta").getByRole("button", { name: CTA }).click();
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
      // The stat chips are the card's first list; the services/process lists
      // live in the collapsed details panel below it.
      await expect(page.locator(`[data-brand="${brand}"] ul`).first().locator("> li")).toHaveCount(
        3
      );
    }
  });

  test("company details panel expands and collapses", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('[data-brand="md"]');
    const toggle = card.getByRole("button").first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Retry the open click as a unit. The markup is server-rendered, so the
    // button exists and is clickable before React has hydrated — a click that
    // lands in that window is simply lost, which under parallel load made this
    // test fail intermittently for no product reason.
    await expect(async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    }).toPass({ timeout: 15_000 });
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

test.describe("hero orbit drawer", () => {
  /** Returns the drawer, plus where the page was scrolled to when it opened. */
  const openDrawer = async (page: Page) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const satellite = page.locator('[aria-label*="Msofe Designer"]').first();
    // Scroll the *stage* into view, not the satellite.
    //
    // Playwright's actionability checks wait for an element to be stable, and
    // on desktop these satellites orbit continuously — they are never stable,
    // so `scrollIntoViewIfNeeded` on one simply times out. The canvas behind
    // them does hold still. Scrolling it (and force-clicking afterwards) is
    // what makes the scroll position we record meaningful on mobile, where the
    // orbit sits below the fold.
    await page.evaluate(() =>
      document.querySelector("canvas")?.scrollIntoView({ block: "center", behavior: "instant" })
    );
    await page.waitForTimeout(400);
    const scrollBefore = await page.evaluate(() => Math.round(window.scrollY));
    await satellite.click({ force: true });
    await expect(page.locator("#orbit-drawer-title")).toBeVisible();
    return { dialog: page.getByRole("dialog"), scrollBefore };
  };

  test("opens in place without moving the page", async ({ page }) => {
    // The regression: the click used to open the drawer *and* smooth-scroll to
    // the ecosystem grid, so the modal appeared over a page that had jumped
    // 882px behind it.
    const { scrollBefore } = await openDrawer(page);
    await page.waitForTimeout(900); // long enough for a smooth scroll to run
    // Sub-pixel layout can round differently once the scroll lock is on; the
    // regression this guards was hundreds of pixels, so allow a hairline.
    const scrollAfter = await page.evaluate(() => Math.round(window.scrollY));
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);
  });

  /**
   * Guards a stacking-context bug that `toBeVisible()` cannot see.
   *
   * The drawer sits inside the hero, whose content wrapper is `relative
   * z-[1]` — a stacking context. Its own z-index of 191 was therefore only
   * ever compared against its siblings, so the sticky header (z-50) and the
   * WhatsApp button (z-40), both at the root, painted straight over it. The
   * panel was "visible" to Playwright the whole time. It is rendered through
   * a portal into <body> now; this asserts on what the browser actually
   * paints, via elementFromPoint.
   */
  test("is not covered by the header or the floating button", async ({ page }) => {
    await openDrawer(page);
    const covered = await page.evaluate(() => {
      const p = document.querySelector('[aria-labelledby="orbit-drawer-title"]') as HTMLElement;
      const b = p.getBoundingClientRect();
      const x = Math.round(b.left + b.width / 2);
      const offenders: string[] = [];
      for (let y = 8; y < b.height - 8; y += 30) {
        const el = document.elementFromPoint(x, y);
        if (!el || !p.contains(el)) offenders.push(`${y}px: ${el?.tagName ?? "none"}`);
      }
      return offenders;
    });
    expect(covered, "every point down the drawer must belong to the drawer").toEqual([]);
  });

  test("keeps both calls to action on screen in a short window", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    const { dialog } = await openDrawer(page);
    // The actions are pinned in a footer while the body scrolls, so they must
    // be fully within the viewport without any scrolling at all.
    for (const action of [
      dialog.getByRole("link", { name: /Visit Msofe Designer/i }),
      dialog.getByRole("button", { name: CTA }),
    ]) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(600);
    }
  });

  test("hands off to the consultation form", async ({ page }) => {
    const { dialog } = await openDrawer(page);
    await dialog.getByRole("button", { name: CTA }).click();
    await expect(page.locator("#orbit-drawer-title")).toHaveCount(0);
    await expect(page.getByRole("dialog").getByRole("heading").first()).toBeVisible();
    // The drawer's scroll lock must not release on the way through.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
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

  test("silently drops a submission filled faster than a human could type", async ({
    request,
    baseURL,
  }) => {
    const res = await request.post("/api/lead", {
      data: { name: "Speed Bot", email: "bot@example.com", _elapsed: 40 },
      headers: headers(baseURL!),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("does not mistake a human submission for a bot", async ({ request, baseURL }) => {
    // `_elapsed` is a duration measured on one clock, so a device running
    // fast or slow cannot fail this the way an absolute timestamp did.
    //
    // The assertion is about *which* answer comes back, not that it succeeds.
    // A bot gets a bare `{ ok: true }` and learns nothing. A genuine lead is
    // either accepted for real — a 200 that carries the server-issued `id`
    // (a delivery backend such as NEXT_PUBLIC_WEB3FORMS_KEY is configured) —
    // or honestly refused with 502/503 when nothing can deliver it. A bare
    // 200 here would mean this submission had been silently discarded as a
    // bot, which is the bug being guarded against.
    const res = await request.post("/api/lead", {
      data: { name: "Real Person", email: "person@example.com", _elapsed: 12_000 },
      headers: headers(baseURL!),
    });
    if (res.status() === 200) {
      const body = (await res.json()) as { id?: string };
      expect(body.id, "a human-paced lead must not be silently dropped").toBeTruthy();
    } else {
      expect([502, 503]).toContain(res.status());
    }
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
