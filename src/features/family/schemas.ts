import { z } from "zod";
import { es } from "@/i18n/es";

export const profileFormSchema = z.object({
  full_name: z.string().trim().min(2, "Escriba su nombre completo."),
  phone: z.string().trim().optional(),
  consent: z.boolean().refine((v) => v === true, { error: es.perfil.consentimientoRequerido }),
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const patientFormSchema = z.object({
  full_name: z.string().trim().min(2, "Escriba el nombre completo."),
  birth_date: z.string().trim().optional(),
  is_self: z.boolean(),
});
export type PatientFormValues = z.infer<typeof patientFormSchema>;
