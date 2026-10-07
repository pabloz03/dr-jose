import { z } from "zod";

export const guestDatosSchema = z.object({
  full_name: z.string().trim().min(2, "Escriba el nombre completo del paciente."),
  contact_email: z.string().trim().min(1, "Escriba un correo electrónico.").email("Escriba un correo válido."),
  // Honeypot: un visitante real nunca ve ni llena este campo (oculto
  // fuera del viewport, sin tabIndex). Si llega con contenido es un bot.
  website: z.string().trim().max(0).optional().or(z.literal("")),
});
export type GuestDatosValues = z.infer<typeof guestDatosSchema>;
