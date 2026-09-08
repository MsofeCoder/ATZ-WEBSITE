import { test, expect } from "@playwright/test";

/**
 * Locale correctness. The regression these guard against: nav links on the
 * Swahili tree pointing at the English routes, and `<html lang>` being patched
 * client-side instead of served correctly.
 */
test.describe("locales", () => {
  test("English home serves lang=en in the initial HTML", async ({ page }) => {
    const res = await page.goto("/");
    const html = await res!.text();
    expect(html).toContain('<html lang="en"');
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One Tanzanian company");
  });

  test("Swahili home serves lang=sw in the initial HTML", async ({ page }) => {
    const res = await page.goto("/sw");
    const html = await res!.text();
    // Must be in the server response, not applied by an effect after hydration.
    expect(html).toContain('<html lang="sw"');
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Kampuni moja ya Kitanzania"
    );
  });

  for (const path of ["/sw", "/sw/contact", "/sw/privacy", "/sw/terms"]) {
    test(`every in-page link on ${path} stays in the Swahili tree`, async ({ page }) => {
      await page.goto(path);
      // The language switcher is excluded by its group: its EN entry is
      // supposed to leave the Swahili tree. Every other link must stay in it.
      const hrefs = await page
        .locator("a[href^='/']:not([href^='/_next'])")
        .evaluateAll((els) =>
          els.filter((e) => !e.closest("[role='group']")).map((e) => e.getAttribute("href")!)
        );
      expect(hrefs.length).toBeGreaterThan(4);

      const escaped = hrefs.filter((h) => !h.startsWith("/sw") && !h.startsWith("/favicon"));
      expect(escaped, `links escaping the Swahili tree: ${escaped.join(", ")}`).toEqual([]);
    });
  }

  test("language switch preserves the current page", async ({ page }) => {
    await page.goto("/contact");
    // On mobile the switcher lives inside the collapsed menu.
    const openMenu = async () => {
      const menu = page.getByRole("button", { name: /open menu|fungua/i });
      if (await menu.isVisible()) await menu.click();
    };
    await openMenu();
    await page
      .getByRole("group", { name: /language|lugha|chagua/i })
      .getByRole("link", { name: "SW" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sw\/contact$/);

    await openMenu();
    await page
      .getByRole("group", { name: /language|lugha|chagua/i })
      .getByRole("link", { name: "EN" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("canonical and hreflang alternates are emitted per locale", async ({ page }) => {
    await page.goto("/sw/contact");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/sw\/contact$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      /\/contact$/
    );
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute(
      "href",
      /\/sw\/contact$/
    );
  });

  test("legacy /en URLs redirect to the canonical root", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page).toHaveURL(/\/contact$/);
  });
});
