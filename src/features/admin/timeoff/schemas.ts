import { z } from "zod";

export const timeOffFormSchema = z
  .object({
    from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elija una fecha."),
    to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elija una fecha."),
    all_day: z.boolean(),
    from_time: z.string().optional(),
    to_time: z.string().optional(),
    clinic_id: z.string().optional(),
    reason: z.string().trim().optional(),
  })
  .refine((v) => v.to_date >= v.from_date, { error: "La fecha de fin debe ser igual o después de la de inicio.", path: ["to_date"] });
export type TimeOffFormValues = z.infer<typeof timeOffFormSchema>;
