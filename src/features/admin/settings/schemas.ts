import { z } from "zod";

export const rulesFormSchema = z.object({
  min_cancel_hours: z.coerce.number().int().min(0, "Debe ser 0 o más.").max(720, "Máximo 720 horas."),
  min_lead_hours: z.coerce.number().int().min(0, "Debe ser 0 o más.").max(720, "Máximo 720 horas."),
  max_booking_days: z.coerce.number().int().min(1, "Debe ser al menos 1 día.").max(365, "Máximo 365 días."),
  slot_step_min: z.coerce.number().int().min(5, "Mínimo 5 minutos.").max(120, "Máximo 120 minutos."),
  reminder_local_time: z.string().regex(/^\d{2}:\d{2}$/, "Use el formato HH:MM."),
});
export type RulesFormValues = z.infer<typeof rulesFormSchema>;

export const appointmentTypeFormSchema = z.object({
  name: z.string().trim().min(2, "Escriba el nombre del tipo de cita."),
  duration_min: z.coerce.number().int().min(5, "Mínimo 5 minutos.").max(240, "Máximo 240 minutos."),
  buffer_after_min: z.coerce.number().int().min(0, "Debe ser 0 o más.").max(120, "Máximo 120 minutos."),
  is_active: z.boolean(),
  bookable_online: z.boolean(),
});
export type AppointmentTypeFormValues = z.infer<typeof appointmentTypeFormSchema>;
