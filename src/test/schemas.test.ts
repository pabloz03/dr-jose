import { describe, expect, it } from "vitest";
import { emailStepSchema, codeStepSchema } from "@/features/auth/schemas";
import { profileFormSchema, patientFormSchema } from "@/features/family/schemas";

describe("auth schemas", () => {
  it("rechaza un correo con formato inválido", () => {
    expect(emailStepSchema.safeParse({ email: "no-es-un-correo" }).success).toBe(false);
  });

  it("acepta un correo válido", () => {
    expect(emailStepSchema.safeParse({ email: "tutor@example.com" }).success).toBe(true);
  });

  it("exige exactamente 6 dígitos para el código", () => {
    expect(codeStepSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(codeStepSchema.safeParse({ code: "abcdef" }).success).toBe(false);
    expect(codeStepSchema.safeParse({ code: "123456" }).success).toBe(true);
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
