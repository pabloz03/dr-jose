import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useAddScheduleException, useRemoveScheduleException, useScheduleExceptions } from "./queries";
import { exceptionFormSchema, type ExceptionFormValues } from "./schemas";

export function ExceptionsManager({ clinicId, doctorId }: { clinicId: string; doctorId: string }) {
  const exceptionsQuery = useScheduleExceptions(clinicId, doctorId);
  const addException = useAddScheduleException();
  const removeException = useRemoveScheduleException();

  const { control, register, handleSubmit, watch, reset, formState } = useForm<ExceptionFormValues>({
    resolver: zodResolver(exceptionFormSchema),
    defaultValues: { on_date: "", is_closed: true, start_time: "", end_time: "", note: "" },
  });
  const isClosed = watch("is_closed");

  async function onSubmit(values: ExceptionFormValues) {
    await addException.mutateAsync({
      clinic_id: clinicId,
      doctor_id: doctorId,
      on_date: values.on_date,
      is_closed: values.is_closed,
      start_time: values.is_closed ? null : values.start_time || null,
      end_time: values.is_closed ? null : values.end_time || null,
      note: values.note || null,
    });
    reset({ on_date: "", is_closed: true, start_time: "", end_time: "", note: "" });
  }

  const exceptions = exceptionsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {exceptionsQuery.isLoading ? (
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : exceptions.length === 0 ? (
        <p className="text-muted">{es.admin.horarios.excepcionesVacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exceptions.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <span className="flex items-center gap-1.5 text-sm text-ink">
                <CalendarOff aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2.25} />
                {formatClinicDateTime(`${e.on_date}T12:00:00`, "d 'de' MMMM")} —{" "}
                {e.is_closed ? "Cerrado" : `${e.start_time?.slice(0, 5)}–${e.end_time?.slice(0, 5)}`}
                {e.note ? ` (${e.note})` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeException.mutate(e.id)}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
                {es.common.eliminar}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label={es.admin.horarios.fechaLabel} isRequired inputProps={{ type: "date", ...register("on_date") }} />
        <Controller
          control={control}
          name="is_closed"
          render={({ field }) => (
            <Checkbox isSelected={field.value} onChange={field.onChange}>
              {es.admin.horarios.cerradoLabel}
            </Checkbox>
          )}
        />
        {!isClosed ? (
          <div className="flex gap-3">
            <Field label={es.admin.horarios.desdeLabel} inputProps={{ type: "time", ...register("start_time") }} />
            <Field label={es.admin.horarios.hastaLabel} inputProps={{ type: "time", ...register("end_time") }} />
          </div>
        ) : null}
        <Field label={es.admin.horarios.notaLabel} inputProps={register("note")} />
        {formState.errors.end_time ? (
          <p className="text-sm text-danger">{formState.errors.end_time.message}</p>
        ) : null}
        <Button type="submit" variant="primary" isPending={addException.isPending} className="self-start">
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {es.admin.horarios.excepcionAgregar}
        </Button>
      </form>
    </div>
  );
}
