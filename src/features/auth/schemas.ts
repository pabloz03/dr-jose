import { z } from "zod";
import { es } from "@/i18n/es";

const passwordSchema = z
  .string()
  .min(8, es.auth.errorPasswordCorta)
  .regex(/[A-Za-z]/, es.auth.errorPasswordFormato)
  .regex(/[0-9]/, es.auth.errorPasswordFormato);

export const loginSchema = z.object({
  email: z.email(es.auth.errorCorreoInvalido),
  password: z.string().min(1, es.auth.errorPasswordRequerida),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Escriba su nombre completo."),
    email: z.email(es.auth.errorCorreoInvalido),
    password: passwordSchema,
    confirmPassword: z.string(),
    consent: z.boolean().refine((v) => v === true, { error: es.perfil.consentimientoRequerido }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: es.auth.errorPasswordNoCoincide,
    path: ["confirmPassword"],
  });
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email(es.auth.errorCorreoInvalido),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: es.auth.errorPasswordNoCoincide,
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
