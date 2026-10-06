import { z } from "zod";

export const hourFormSchema = z
  .object({
    weekday: z.coerce.number().int().min(1).max(7),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use el formato HH:MM."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use el formato HH:MM."),
  })
  .refine((v) => v.end_time > v.start_time, {
    error: "La hora de fin debe ser después de la de inicio.",
    path: ["end_time"],
  });
export type HourFormValues = z.infer<typeof hourFormSchema>;

export const exceptionFormSchema = z
  .object({
    on_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elija una fecha."),
    is_closed: z.boolean(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    note: z.string().trim().optional(),
  })
  .refine((v) => v.is_closed || (!!v.start_time && !!v.end_time && v.end_time > v.start_time), {
    error: "La hora de fin debe ser después de la de inicio.",
    path: ["end_time"],
  });
export type ExceptionFormValues = z.infer<typeof exceptionFormSchema>;
