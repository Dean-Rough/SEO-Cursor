import { test, expect } from "@playwright/test";

test.describe("SEO Wizard home page", () => {
  test("renders primary inputs and form", async ({ page }) => {
    await page.goto("/");

    // Verify form inputs are visible
    await expect(page.getByLabel(/Business name/i)).toBeVisible();
    await expect(page.getByLabel(/Website/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /generate strategy/i })).toBeVisible();

    // Verify output tabs are NOT visible initially (only shown after report generation)
    const tablist = page.getByRole("tablist");
    await expect(tablist).not.toBeVisible();
  });
});
