import { describe, expect, it } from "vitest";
import { loginSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema } from "@/features/auth/schemas";
import { profileFormSchema, patientFormSchema } from "@/features/family/schemas";
import { guestDatosSchema } from "@/features/booking/guest/schemas";
import { hourFormSchema } from "@/features/admin/schedule/schemas";

const validSignUp = {
  full_name: "María López",
  email: "tutor@example.com",
  password: "abcd1234",
  confirmPassword: "abcd1234",
  consent: true,
};

describe("login schema", () => {
  it("rechaza un correo con formato inválido", () => {
    expect(loginSchema.safeParse({ email: "no-es-un-correo", password: "abcd1234" }).success).toBe(false);
  });

  it("rechaza contraseña vacía", () => {
    expect(loginSchema.safeParse({ email: "tutor@example.com", password: "" }).success).toBe(false);
  });

  it("acepta correo y contraseña válidos", () => {
    expect(loginSchema.safeParse({ email: "tutor@example.com", password: "abcd1234" }).success).toBe(true);
  });
});

describe("sign up schema", () => {
  it("pasa con datos válidos", () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it("rechaza contraseña menor a 8 caracteres", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "abc123", confirmPassword: "abc123" }).success).toBe(false);
  });

  it("rechaza contraseña solo con letras", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "abcdefgh", confirmPassword: "abcdefgh" }).success).toBe(false);
  });

  it("rechaza contraseña solo con dígitos", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "12345678", confirmPassword: "12345678" }).success).toBe(false);
  });

  it("rechaza si la confirmación no coincide", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, confirmPassword: "otraClave1" }).success).toBe(false);
  });

  it("rechaza si no se acepta el consentimiento", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, consent: false }).success).toBe(false);
  });
});

describe("forgot password schema", () => {
  it("rechaza un correo inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "no-es-un-correo" }).success).toBe(false);
  });

  it("acepta un correo válido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "tutor@example.com" }).success).toBe(true);
  });
});

describe("reset password schema", () => {
  it("pasa con contraseñas válidas que coinciden", () => {
    expect(resetPasswordSchema.safeParse({ password: "abcd1234", confirmPassword: "abcd1234" }).success).toBe(true);
  });

  it("rechaza si la confirmación no coincide", () => {
    expect(resetPasswordSchema.safeParse({ password: "abcd1234", confirmPassword: "distinta1" }).success).toBe(false);
  });
});

describe("profile schema", () => {
  it("exige aceptar el consentimiento", () => {
    const result = profileFormSchema.safeParse({ full_name: "María López", phone: "", consent: false });
    expect(result.success).toBe(false);
  });

  it("pasa con nombre y consentimiento aceptado", () => {
    const result = profileFormSchema.safeParse({ full_name: "María López", phone: "", consent: true });
    expect(result.success).toBe(true);
  });
});

describe("patient schema", () => {
  it("exige nombre de al menos 2 caracteres", () => {
    expect(patientFormSchema.safeParse({ full_name: "A", birth_date: "", is_self: false }).success).toBe(false);
  });

  it("pasa con datos mínimos válidos", () => {
    expect(patientFormSchema.safeParse({ full_name: "Juan Pérez", birth_date: "", is_self: false }).success).toBe(true);
  });
});

describe("hour form schema (horarios de clínica)", () => {
  const base = { weekday: 6, start_time: "08:00", end_time: "14:00" };

  it("convierte semana del mes vacía (\"\") a null — aplica todas las semanas", () => {
    const result = hourFormSchema.safeParse({ ...base, week_of_month: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.week_of_month).toBeNull();
  });

  it("acepta y coerciona una semana específica (1-5)", () => {
    const result = hourFormSchema.safeParse({ ...base, week_of_month: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.week_of_month).toBe(3);
  });

  it("rechaza una semana fuera de rango", () => {
    expect(hourFormSchema.safeParse({ ...base, week_of_month: "6" }).success).toBe(false);
    expect(hourFormSchema.safeParse({ ...base, week_of_month: "0" }).success).toBe(false);
  });

  it("rechaza si la hora de fin no es después de la de inicio", () => {
    const result = hourFormSchema.safeParse({ ...base, week_of_month: "", start_time: "14:00", end_time: "08:00" });
    expect(result.success).toBe(false);
  });
});

describe("guest booking schema", () => {
  it("exige nombre y correo válidos", () => {
    expect(guestDatosSchema.safeParse({ full_name: "A", contact_email: "tutor@example.com" }).success).toBe(false);
    expect(guestDatosSchema.safeParse({ full_name: "Juan Pérez", contact_email: "no-es-correo" }).success).toBe(false);
  });

  it("pasa con nombre y correo válidos, sin llenar el honeypot", () => {
    const result = guestDatosSchema.safeParse({ full_name: "Juan Pérez", contact_email: "tutor@example.com", website: "" });
    expect(result.success).toBe(true);
  });

  it("rechaza si el campo honeypot viene con contenido (bot)", () => {
    const result = guestDatosSchema.safeParse({
      full_name: "Juan Pérez",
      contact_email: "tutor@example.com",
      website: "http://spam.example",
    });
    expect(result.success).toBe(false);
  });
});
