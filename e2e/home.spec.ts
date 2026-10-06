import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("la página de inicio carga y anuncia un h1 @a11y", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("/ sin violaciones críticas/serias de axe @a11y", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});
