import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const OPTIONS_BODY = {
  ok: true,
  clinic: { id: "c1", name: "Clínica Central", address: "Zona 10", maps_url: null, timezone: "America/Guatemala" },
  doctor: { id: "d1", full_name: "Dr. José Rodríguez" },
  types: [{ id: "t1", name: "Consulta", duration_min: 30 }],
  settings: { min_cancel_hours: 24, max_booking_days: 90 },
};

const SLOT = { slot_start: "2026-10-09T18:00:00.000Z", slot_end: "2026-10-09T18:30:00.000Z" };

function mockGuestBooking(page: import("@playwright/test").Page, bookResponse: Record<string, unknown>) {
  return page.route("**/functions/v1/guest-booking*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    const body = JSON.parse(route.request().postData() ?? "{}");
    if (body.mode === "options") {
      return route.fulfill({ status: 200, contentType: "application/json", headers: CORS_HEADERS, body: JSON.stringify(OPTIONS_BODY) });
    }
    if (body.mode === "slots") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true, slots: [SLOT] }),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", headers: CORS_HEADERS, body: JSON.stringify(bookResponse) });
  });
}

async function fillDatosAndPickTypeAndSlot(page: import("@playwright/test").Page) {
  await page.goto("/reservar-invitado");
  await page.getByLabel(/Nombre completo/).fill("Juan Pérez");
  await page.getByLabel(/Correo electrónico/).fill("tutor@example.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("Consulta").click();
  const availableDay = page.locator('[role="button"][data-rac]:not([data-unavailable])').first();
  await availableDay.click();
  await page.getByRole("button", { name: "12:00 PM" }).click();
}

test("/ingresar tiene un enlace discreto a reservar sin cuenta", async ({ page }) => {
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await page.goto("/ingresar");
  const link = page.getByRole("link", { name: "¿Prefiere reservar sin crear una cuenta?" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/reservar-invitado$/);
  await expect(page.getByRole("heading", { name: "¿Para quién es la cita?" })).toBeVisible();
});

test("reservar como invitado de punta a punta", async ({ page }) => {
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await fillDatosAndPickTypeAndSlot(page);
  await expect(page.getByRole("heading", { name: "Confirme su cita" })).toBeVisible();
  await expect(page.getByText("tutor@example.com")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("heading", { name: "Cita reservada" })).toBeVisible();
  await expect(page.getByText(/Le enviamos un comprobante a tutor@example.com/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();

  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/ingresar$/);
  await expect(page.getByLabel(/Correo electr/)).toHaveValue("tutor@example.com");
});

test("si falla por un error inesperado, muestra un mensaje genérico (no se queda en silencio)", async ({ page }) => {
  await page.route("**/functions/v1/guest-booking*", (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: CORS_HEADERS });
    const body = JSON.parse(route.request().postData() ?? "{}");
    if (body.mode === "options") {
      return route.fulfill({ status: 200, contentType: "application/json", headers: CORS_HEADERS, body: JSON.stringify(OPTIONS_BODY) });
    }
    if (body.mode === "slots") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: true, slots: [SLOT] }),
      });
    }
    // Simula una falla de transporte real (no un {ok:false} de negocio).
    return route.fulfill({ status: 500, contentType: "application/json", headers: CORS_HEADERS, body: "{}" });
  });
  await fillDatosAndPickTypeAndSlot(page);
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("alert")).toHaveText("No pudimos completar la reserva. Intente de nuevo.");
});

test("si el horario ya se ocupó, anuncia el error y regresa a elegir fecha/hora", async ({ page }) => {
  await mockGuestBooking(page, { ok: false, error: "slot_unavailable" });
  await fillDatosAndPickTypeAndSlot(page);
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("heading", { name: "Elija fecha y hora", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Ese horario acaba de ocuparse. Elija otro.");
});

test("reservar-invitado @a11y sin violaciones críticas/serias en el paso de datos", async ({ page }) => {
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await page.goto("/reservar-invitado");
  await expect(page.getByRole("heading", { name: "¿Para quién es la cita?" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});
