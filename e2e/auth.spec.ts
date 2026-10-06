import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("sin sesión, / redirige a /ingresar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("sin sesión, /perfil redirige a /ingresar", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("/ingresar sin violaciones críticas/serias de axe @a11y", async ({ page }) => {
  await page.goto("/ingresar");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});

test("valida el formato de correo antes de enviar", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("no-es-un-correo");
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByText("Escriba un correo válido.")).toBeVisible();
});

test("tras enviar el correo, pasa al paso de código y mueve el foco al encabezado @a11y", async ({ page }) => {
  await page.route("**/auth/v1/otp*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("tutor@example.com");
  await page.getByRole("button", { name: "Enviar código" }).click();

  const heading = page.getByRole("heading", { name: "Revise su correo" });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.getByText("tutor@example.com")).toBeVisible();
});

test("el campo de código permite pegar vía portapapeles (SC 3.3.8)", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/auth/v1/otp*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("tutor@example.com");
  await page.getByRole("button", { name: "Enviar código" }).click();

  const codeInput = page.getByLabel("Código de 6 dígitos");
  await codeInput.click();
  await page.evaluate(() => navigator.clipboard.writeText("123456"));
  await page.keyboard.press("ControlOrMeta+v");
  await expect(codeInput).toHaveValue("123456");
});
