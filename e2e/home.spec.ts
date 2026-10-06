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

test("sin scroll horizontal a 320px de ancho (reflow, SC 1.4.10) @a11y", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/_ui");
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test("manifest.webmanifest expone los campos mínimos de instalabilidad", async ({ page, baseURL }) => {
  const res = await page.request.get(`${baseURL}/manifest.webmanifest`);
  const manifest = await res.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.display).toBe("standalone");
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});

test("/_ui es operable solo con teclado: abre y cierra el diálogo con Enter y Escape @a11y", async ({ page }) => {
  await page.goto("/_ui");
  await page.getByRole("button", { name: "Abrir diálogo" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Confirmar acción" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Confirmar acción" })).toBeHidden();
});
