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

test("/_ui sin violaciones críticas/serias de axe @a11y", async ({ page }) => {
  await page.goto("/_ui");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});

test("/_ui es operable solo con teclado: abre y cierra el diálogo con Enter y Escape @a11y", async ({ page }) => {
  await page.goto("/_ui");
  await page.getByRole("button", { name: "Abrir diálogo" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Confirmar acción" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Confirmar acción" })).toBeHidden();
});
