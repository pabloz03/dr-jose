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

test("sin sesión, /citas/nueva redirige a /ingresar", async ({ page }) => {
  await page.goto("/citas/nueva");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("sin sesión, /citas redirige a /ingresar", async ({ page }) => {
  await page.goto("/citas");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("sin sesión, /citas/:id redirige a /ingresar", async ({ page }) => {
  await page.goto("/citas/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("sin sesión, /ayuda redirige a /ingresar", async ({ page }) => {
  await page.goto("/ayuda");
  await expect(page).toHaveURL(/\/ingresar$/);
});

for (const path of [
  "/admin",
  "/admin/calendario",
  "/admin/pacientes",
  "/admin/citas/nueva",
  "/admin/citas/00000000-0000-0000-0000-000000000000",
  "/admin/clinicas",
  "/admin/ajustes",
  "/admin/horarios",
  "/admin/bloqueos",
]) {
  test(`sin sesión, ${path} redirige a /ingresar`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/ingresar$/);
  });
}

test("/ingresar sin violaciones críticas/serias de axe @a11y", async ({ page }) => {
  await page.goto("/ingresar");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});

test("valida correo y contraseña requeridos antes de enviar", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("no-es-un-correo");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Escriba un correo válido.")).toBeVisible();
});

test("contraseña incorrecta muestra un mensaje genérico y no navega", async ({ page }) => {
  await page.route("**/auth/v1/token*", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }),
    }),
  );
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("tutor@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("contraseñaIncorrecta1");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("el botón de mostrar/ocultar contraseña cambia el tipo del campo", async ({ page }) => {
  await page.goto("/ingresar");
  const passwordInput = page.getByLabel("Contraseña", { exact: true });
  await passwordInput.fill("algunaClave1");
  await expect(passwordInput).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(passwordInput).toHaveAttribute("type", "password");
});

for (const path of ["/crear-cuenta", "/recuperar", "/recuperar/confirmar"]) {
  test(`${path} sin violaciones críticas/serias de axe @a11y`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
  });
}

test("crear cuenta exige aceptar el aviso de privacidad", async ({ page }) => {
  await page.goto("/crear-cuenta");
  await page.getByLabel("Nombre completo").fill("Juan Pérez");
  await page.getByLabel("Correo electrónico").fill("nuevo@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("abcd1234");
  await page.getByLabel("Confirmar contraseña").fill("abcd1234");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Debe aceptar el aviso de privacidad para continuar.")).toBeVisible();
});
