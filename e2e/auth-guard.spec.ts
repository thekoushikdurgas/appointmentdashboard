import { test, expect } from "@playwright/test";

test.describe("auth guard", () => {
  test("dashboard redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("phone tool route requires auth", async ({ page }) => {
    await page.goto("/phone", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
  });
});
