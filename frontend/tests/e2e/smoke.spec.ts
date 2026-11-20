import { test, expect } from "@playwright/test";

test.describe("AI Smart Bazar Smoke Suite", () => {
  test("renders sign in page or dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Smart Bazar/);
  });
});
