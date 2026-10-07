import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus, X } from "lucide-react";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useAddClinicHour, useClinicHours, useRemoveClinicHour, OverlapError } from "./queries";
import { hourFormSchema, type HourFormValues } from "./schemas";
import { timeRangesOverlap } from "./timeOverlap";

export function WeeklySchedule({ clinicId, doctorId }: { clinicId: string; doctorId: string }) {
  const hoursQuery = useClinicHours(clinicId, doctorId);
  const addHour = useAddClinicHour();
  const removeHour = useRemoveClinicHour();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<
    z.input<typeof hourFormSchema>,
    unknown,
    z.output<typeof hourFormSchema>
  >({
    resolver: zodResolver(hourFormSchema),
    defaultValues: { weekday: 1, start_time: "08:00", end_time: "17:00" },
  });

  const hours = hoursQuery.data ?? [];

  async function onSubmit(values: HourFormValues) {
    setFormError(null);
    const sameDay = hours.filter((h) => h.weekday === values.weekday);
    const clashes = sameDay.some((h) =>
      timeRangesOverlap(values.start_time, values.end_time, h.start_time.slice(0, 5), h.end_time.slice(0, 5)),
    );
    if (clashes) {
      setFormError(es.admin.horarios.errorSolape);
      return;
    }
    try {
      await addHour.mutateAsync({ clinic_id: clinicId, doctor_id: doctorId, ...values });
      reset({ weekday: values.weekday, start_time: "08:00", end_time: "17:00" });
    } catch (error) {
      setFormError(error instanceof OverlapError ? es.admin.horarios.errorSolape : es.citas.errorGenerico);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {hoursQuery.isLoading ? (
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {es.admin.horarios.dias.map((dayLabel, i) => {
            const weekday = i + 1;
            const dayHours = hours.filter((h) => h.weekday === weekday);
            return (
              <div key={weekday} className="flex flex-col gap-1 border-b border-line pb-2">
                <span className="font-medium text-ink">{dayLabel}</span>
                {dayHours.length === 0 ? (
                  <span className="text-sm text-muted">{es.admin.horarios.vacio}</span>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {dayHours.map((h) => (
                      <li key={h.id} className="flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-1 text-sm">
                        <span>
                          {h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeHour.mutate(h.id)}
                          aria-label={`Quitar franja ${h.start_time.slice(0, 5)} a ${h.end_time.slice(0, 5)} el ${dayLabel}`}
                          className="text-muted hover:text-danger"
                        >
                          <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="weekday" className="text-sm font-medium text-ink">
            {es.admin.horarios.diaLabel}
          </label>
          <select
            id="weekday"
            {...register("weekday")}
            className="min-h-tap rounded-sm border border-border-ui bg-surface px-3 text-[15px] text-ink"
          >
            {es.admin.horarios.dias.map((label, i) => (
              <option key={i + 1} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label={es.admin.horarios.desdeLabel}
          isInvalid={!!formState.errors.start_time}
          errorMessage={formState.errors.start_time?.message}
          inputProps={{ type: "time", ...register("start_time") }}
        />
        <Field
          label={es.admin.horarios.hastaLabel}
          isInvalid={!!formState.errors.end_time}
          errorMessage={formState.errors.end_time?.message}
          inputProps={{ type: "time", ...register("end_time") }}
        />
        <Button type="submit" variant="primary" isPending={addHour.isPending}>
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {es.admin.horarios.franjaAgregar}
        </Button>
      </form>
      {formError ? (
        <p className="text-danger" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );
}
