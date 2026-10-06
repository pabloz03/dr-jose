import { z } from "zod";

export const emailStepSchema = z.object({
  email: z.email("Escriba un correo válido."),
});
export type EmailStepValues = z.infer<typeof emailStepSchema>;

export const codeStepSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 dígitos."),
});
export type CodeStepValues = z.infer<typeof codeStepSchema>;
