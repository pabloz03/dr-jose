import { z } from "zod";

export const clinicFormSchema = z.object({
  name: z.string().trim().min(2, "Escriba el nombre de la clínica."),
  address: z.string().trim().optional(),
  maps_url: z.union([z.url("Escriba un enlace válido."), z.literal("")]).optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  is_active: z.boolean(),
});
export type ClinicFormValues = z.infer<typeof clinicFormSchema>;
