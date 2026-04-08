import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("root responds without server error", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});
