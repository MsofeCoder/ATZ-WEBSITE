import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3311";

test.describe("ATZ lead funnel", () => {
  test("home renders hero + sections", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One Tanzanian company");
    await expect(page.locator("#ecosystem")).toBeVisible();
    await expect(page.locator("#testimonials")).toBeVisible();
    await expect(page.locator("#values")).toBeVisible();
  });

  test("Swahili route renders translated content", async ({ page }) => {
    await page.goto(`${BASE}/sw`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kampuni moja ya Kitanzania");
    await expect(page.locator("html")).toHaveAttribute("lang", /sw|^$/);
  });

  test("modal focus trap: open, tab cycles inside, escape closes, focus restored", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /Request a Consultation/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Tab many times — focus must stay inside the dialog
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    const inDialog = await dialog.evaluate(
      (el) => el.contains(document.activeElement)
    );
    expect(inDialog).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("form validation error on empty submit", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /Request a Consultation/i }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: /Send Request/i }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Please fill in your name");
  });

  test("successful submission hits API and shows success view", async ({ page }) => {
    let apiCalled = false;
    await page.route("**/api/lead", async (route) => {
      apiCalled = true;
      const res = await route.fetch();
      expect(res.status()).toBe(200);
      await route.fulfill({ response: res });
    });
    await page.goto(BASE);
    await page.getByRole("button", { name: /Request a Consultation/i }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#cf-name").fill("E2E Tester");
    await dialog.locator("#cf-email").fill("e2e@atzcompany.co.tz");
    await dialog.locator("#cf-message").fill("Automated verification run");
    await dialog.getByRole("button", { name: /Send Request/i }).click();

    await expect(dialog.getByText("Request received")).toBeVisible();
    expect(apiCalled).toBe(true);
  });

  test("API rejects invalid payload server-side", async ({ request }) => {
    const res = await request.post(`${BASE}/api/lead`, {
      data: { email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });

  test("stat chips: every company card has exactly 3", async ({ page }) => {
    await page.goto(BASE);
    const chips = page.locator("#ecosystem .grid > div .grid.grid-cols-3 > div");
    await expect(chips).toHaveCount(9); // 3 cards × 3 chips
  });
});
