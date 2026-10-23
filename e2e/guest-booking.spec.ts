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

// Relativa a "ahora" (+3 días) en vez de una fecha fija: una fecha
// hardcodeada queda en el pasado tarde o temprano y el calendario la
// deshabilita, rompiendo el test sin que haya ninguna regresión real.
const slotDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
slotDate.setUTCHours(18, 0, 0, 0);
const SLOT = {
  slot_start: slotDate.toISOString(),
  slot_end: new Date(slotDate.getTime() + 30 * 60 * 1000).toISOString(),
};

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

// Orden "Savia": tipo → fecha/hora → datos de contacto → confirmar
// (antes empezaba por datos) — ver plan de fidelidad Figma, rama UI2.
// Cada paso de selección usa el patrón "elegir → Continuar": tocar una
// tarjeta/horario solo lo selecciona, hay que presionar el botón del
// pie fijo para avanzar.
async function pickTypeAndSlot(page: import("@playwright/test").Page) {
  await page.goto("/reservar-invitado");
  await page.getByText("Consulta").click();
  await page.getByRole("button", { name: "Elegir fecha y hora" }).click();
  const availableDay = page.locator('[role="button"][data-rac]:not([data-unavailable])').first();
  await availableDay.click();
  await page.getByRole("button", { name: "12:00 PM" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
}

async function fillDatosAndContinue(page: import("@playwright/test").Page) {
  await pickTypeAndSlot(page);
  await page.getByLabel(/Nombre completo/).fill("Juan Pérez");
  await page.getByLabel(/Correo electrónico/).fill("tutor@example.com");
  await page.getByRole("button", { name: "Revisar mi cita" }).click();
}

test("/ingresar tiene una tarjeta destacada para reservar sin cuenta", async ({ page }) => {
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await page.goto("/ingresar");
  const link = page.getByRole("link", { name: "Continuar como invitado" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/reservar-invitado$/);
  await expect(page.getByRole("heading", { name: "¿Qué tipo de cita necesita?" })).toBeVisible();
});

test("reservar como invitado de punta a punta", async ({ page }) => {
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await fillDatosAndContinue(page);
  await expect(page.getByRole("heading", { name: "Confirme su cita" })).toBeVisible();
  await expect(page.getByText("tutor@example.com")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("heading", { name: "¡Cita confirmada!" })).toBeVisible();
  await expect(page.getByText(/Le enviamos un comprobante a tutor@example.com/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();

  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/crear-cuenta$/);
  await expect(page.getByLabel(/Correo electr/)).toHaveValue("tutor@example.com");
  await expect(page.getByLabel("Nombre completo")).toHaveValue("Juan Pérez");
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
  await fillDatosAndContinue(page);
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("alert")).toHaveText("No pudimos completar la reserva. Intente de nuevo.");
});

test("si el horario ya se ocupó, anuncia el error y regresa a elegir fecha/hora", async ({ page }) => {
  await mockGuestBooking(page, { ok: false, error: "slot_unavailable" });
  await fillDatosAndContinue(page);
  await page.getByRole("button", { name: "Confirmar cita" }).click();
  await expect(page.getByRole("heading", { name: "Elija fecha y hora", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Ese horario acaba de ocuparse. Elija otro.");
});

test("reservar-invitado @a11y sin violaciones críticas/serias en el paso de datos", async ({ page }) => {
  // Reduced motion evita medir contraste a mitad de la transición de
  // entrada del paso (motion/react respeta prefers-reduced-motion vía
  // MotionConfig reducedMotion="user") — sin esto, axe puede correr
  // mientras el panel todavía está en fade-in y reportar colores
  // diluidos por la opacidad parcial, no un problema real de contraste.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockGuestBooking(page, { ok: true, appointment_id: "a1" });
  await pickTypeAndSlot(page);
  await expect(page.getByRole("heading", { name: "¿Para quién es la cita?" })).toBeVisible();
  // motion/react sigue animando opacidad bajo reduced motion (solo
  // suprime transform) — sin esperar a que el fade-in de 240ms
  // termine, axe mide contraste a mitad de transición y reporta
  // colores diluidos que no existen una vez el panel termina de
  // aparecer.
  await page.waitForTimeout(350);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const criticalOrSerious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([]);
});
