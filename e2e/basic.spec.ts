import { test, expect } from "@playwright/test";

test.describe("SEO Wizard home page", () => {
  test("renders primary inputs and output tabs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel(/Business name/i)).toBeVisible();
    await expect(page.getByLabel(/Website/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /generate strategy/i })).toBeVisible();

    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole("tab", { name: /Summary/i })).toBeVisible();
    await expect(tablist.getByRole("tab", { name: /Metadata plan/i })).toBeVisible();
  });
});
