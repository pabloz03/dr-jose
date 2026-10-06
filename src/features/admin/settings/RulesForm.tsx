import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useClinicSettings } from "@/features/booking/queries";
import { useUpdateClinicSettings } from "./queries";
import { rulesFormSchema, type RulesFormValues } from "./schemas";

export function RulesForm({ clinicId }: { clinicId: string }) {
  const settingsQuery = useClinicSettings(clinicId);
  const updateSettings = useUpdateClinicSettings();
  // z.coerce.number() tiene input `unknown` y output `number` — dos
  // generics para que register() y handleSubmit() usen cada tipo correcto.
  const { register, handleSubmit, reset, formState } = useForm<
    z.input<typeof rulesFormSchema>,
    unknown,
    z.output<typeof rulesFormSchema>
  >({
    resolver: zodResolver(rulesFormSchema),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        min_cancel_hours: settingsQuery.data.min_cancel_hours,
        min_lead_hours: settingsQuery.data.min_lead_hours,
        max_booking_days: settingsQuery.data.max_booking_days,
        slot_step_min: settingsQuery.data.slot_step_min,
        reminder_local_time: settingsQuery.data.reminder_local_time.slice(0, 5),
      });
    }
  }, [settingsQuery.data, reset]);

  async function onSubmit(values: RulesFormValues) {
    await updateSettings.mutateAsync({ clinic_id: clinicId, ...values });
  }

  if (settingsQuery.isLoading) {
    return (
      <p className="text-muted" role="status">
        {es.common.cargando}
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field
        label={es.admin.ajustes.anticipacionLabel}
        isInvalid={!!formState.errors.min_cancel_hours}
        errorMessage={formState.errors.min_cancel_hours?.message}
        inputProps={{ type: "number", min: 0, ...register("min_cancel_hours") }}
      />
      <Field
        label="Antelación mínima de reserva (horas)"
        isInvalid={!!formState.errors.min_lead_hours}
        errorMessage={formState.errors.min_lead_hours?.message}
        inputProps={{ type: "number", min: 0, ...register("min_lead_hours") }}
      />
      <Field
        label={es.admin.ajustes.ventanaLabel}
        isInvalid={!!formState.errors.max_booking_days}
        errorMessage={formState.errors.max_booking_days?.message}
        inputProps={{ type: "number", min: 1, ...register("max_booking_days") }}
      />
      <Field
        label={es.admin.ajustes.pasoLabel}
        isInvalid={!!formState.errors.slot_step_min}
        errorMessage={formState.errors.slot_step_min?.message}
        inputProps={{ type: "number", min: 5, step: 5, ...register("slot_step_min") }}
      />
      <Field
        label={es.admin.ajustes.recordatorioLabel}
        isInvalid={!!formState.errors.reminder_local_time}
        errorMessage={formState.errors.reminder_local_time?.message}
        inputProps={{ type: "time", ...register("reminder_local_time") }}
      />
      <Button type="submit" variant="primary" isPending={updateSettings.isPending} className="self-start">
        {es.common.guardar}
      </Button>
    </form>
  );
}
