import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Check } from "lucide-react";
import { es } from "@/i18n/es";
import { ControlledField } from "@/components/ui/ControlledField";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { showToast } from "@/components/ui/Toast";
import { useClinicSettings } from "@/features/booking/queries";
import { useUpdateClinicSettings } from "./queries";
import { rulesFormSchema, type RulesFormValues } from "./schemas";

export function RulesForm({ clinicId }: { clinicId: string }) {
  const settingsQuery = useClinicSettings(clinicId);
  const updateSettings = useUpdateClinicSettings();
  const [formError, setFormError] = useState<string | null>(null);
  // z.coerce.number() tiene input `unknown` y output `number` — dos
  // generics para que register() y handleSubmit() usen cada tipo correcto.
  const { control, handleSubmit, reset } = useForm<
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
    setFormError(null);
    try {
      await updateSettings.mutateAsync({ clinic_id: clinicId, ...values });
      showToast({ title: es.admin.ajustes.reglasGuardadoOk, tone: "success" });
    } catch {
      setFormError(es.common.errorAccionGenerico);
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <p className="text-muted" role="status">
        {es.common.cargando}
      </p>
    );
  }

  if (settingsQuery.isError) {
    return <ErrorState onRetry={() => settingsQuery.refetch()} />;
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ControlledField
          control={control}
          name="min_cancel_hours"
          label={es.admin.ajustes.anticipacionLabel}
          inputProps={{ type: "number", min: 0 }}
        />
        <ControlledField
          control={control}
          name="min_lead_hours"
          label="Antelación mínima de reserva (horas)"
          inputProps={{ type: "number", min: 0 }}
        />
        <ControlledField
          control={control}
          name="max_booking_days"
          label={es.admin.ajustes.ventanaLabel}
          inputProps={{ type: "number", min: 1 }}
        />
        <ControlledField
          control={control}
          name="slot_step_min"
          label={es.admin.ajustes.pasoLabel}
          inputProps={{ type: "number", min: 5, step: 5 }}
        />
        <ControlledField
          control={control}
          name="reminder_local_time"
          label={es.admin.ajustes.recordatorioLabel}
          inputProps={{ type: "time" }}
        />
      </div>
      <Button type="submit" variant="primary" isPending={updateSettings.isPending} className="self-start">
        <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.common.guardar}
      </Button>
      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
