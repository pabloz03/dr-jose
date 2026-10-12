import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

test("/a/:token con token inválido muestra mensaje claro y enlace a la app", async ({ page }) => {
  await page.route("**/functions/v1/appointment-action*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "invalid_or_expired" }),
    });
  });
  await page.goto("/a/token-invalido");
  await expect(page.getByRole("heading", { name: "Este enlace ya no es válido" })).toBeVisible();
  await page.getByRole("button", { name: "Ir a la aplicación" }).click();
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("/a/:token con propósito confirm muestra el resumen y el botón de confirmar", async ({ page }) => {
  await page.route("**/functions/v1/appointment-action*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    const body = JSON.parse(route.request().postData() ?? "{}");
    if (body.mode === "execute") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true, purpose: "confirm", appointment: { id: "1", status: "confirmed" } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        purpose: "confirm",
        appointment: {
          id: "1",
          status: "scheduled",
          starts_at: "2026-03-10T16:00:00.000Z",
          doctor_id: "d1",
          clinic_id: "c1",
          type_id: "t1",
          type: { name: "Control", duration_min: 20 },
          clinic: { name: "Clínica Central", address: "Zona 10", maps_url: null, timezone: "America/Guatemala" },
          patient: { full_name: "Juan Pérez" },
        },
      }),
    });
  });
  await page.goto("/a/token-confirm");
  await expect(page.getByRole("heading", { name: "Confirmar esta cita" })).toBeVisible();
  await expect(page.getByText("Juan Pérez")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar mi cita" }).click();
  await expect(page.getByRole("heading", { name: "Su cita quedó confirmada." })).toBeVisible();
});

test("/a/:token: si la confirmación falla por error de transporte, muestra mensaje y no se cuelga", async ({ page }) => {
  let mode: string | undefined;
  await page.route("**/functions/v1/appointment-action*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    const body = JSON.parse(route.request().postData() ?? "{}");
    mode = body.mode;
    if (mode === "execute") {
      // Simula una falla de transporte real (no un {ok:false} de negocio) —
      // supabase-js la hace rechazar la promesa de mutateAsync.
      return route.fulfill({ status: 500, contentType: "application/json", headers: CORS_HEADERS, body: "{}" });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ok: true,
        purpose: "confirm",
        appointment: {
          id: "1",
          status: "scheduled",
          starts_at: "2026-03-10T16:00:00.000Z",
          doctor_id: "d1",
          clinic_id: "c1",
          type_id: "t1",
          type: { name: "Control", duration_min: 20 },
          clinic: { name: "Clínica Central", address: "Zona 10", maps_url: null, timezone: "America/Guatemala" },
          patient: { full_name: "Juan Pérez" },
        },
      }),
    });
  });
  await page.goto("/a/token-confirm");
  await expect(page.getByRole("heading", { name: "Confirmar esta cita" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar mi cita" }).click();
  // No se cuelga: el botón vuelve a estar habilitado y aparece el mensaje de error, no un spinner infinito ni una pantalla en blanco.
  await expect(page.getByText("No pudimos completar la acción. Intente de nuevo o ingrese a la aplicación.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar mi cita" })).toBeEnabled();
});

test("/a/:token @a11y sin violaciones críticas/serias en el estado inválido", async ({ page }) => {
  await page.route("**/functions/v1/appointment-action*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "invalid_or_expired" }),
    });
  });
  await page.goto("/a/token-invalido");
  await expect(page.getByRole("heading", { name: "Este enlace ya no es válido" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});
