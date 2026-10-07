import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { useCancelAppointment, useRescheduleAppointment } from "@/features/appointments/queries";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinics } from "../clinics/queries";
import { useAffectedAppointments, useCreateTimeOff, useRemoveTimeOff, useTimeOffList } from "./queries";
import { timeOffFormSchema, type TimeOffFormValues } from "./schemas";
import { timeOffRangeUtc } from "./timeOffRange";
import { RescheduleSheet } from "@/features/appointments/RescheduleSheet";
import type { AppointmentWithDetails } from "@/features/appointments/queries";
import type { SlotRow } from "@/features/booking/queries";
import type { z } from "zod";

export function TimeOffPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const [range, setRange] = useState<{ starts_at: string; ends_at: string; clinic_id: string | null } | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<AppointmentWithDetails | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const staffQuery = useMyStaff();
  const clinicsQuery = useAdminClinics();
  const timeOffQuery = useTimeOffList(staffQuery.data?.id);
  const affected = useAffectedAppointments();
  const createTimeOff = useCreateTimeOff();
  const removeTimeOff = useRemoveTimeOff();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const { control, register, handleSubmit, watch, formState } = useForm<
    z.input<typeof timeOffFormSchema>,
    unknown,
    z.output<typeof timeOffFormSchema>
  >({
    resolver: zodResolver(timeOffFormSchema),
    defaultValues: { from_date: "", to_date: "", all_day: true, from_time: "", to_time: "", clinic_id: "", reason: "" },
  });
  const allDay = watch("all_day");

  async function onPreview(values: TimeOffFormValues) {
    if (!staffQuery.data) return;
    const { starts_at, ends_at } = timeOffRangeUtc(values);
    const clinicId = values.clinic_id || null;
    setRange({ starts_at, ends_at, clinic_id: clinicId });
    setResolvedIds(new Set());
    await affected.mutateAsync({ doctorId: staffQuery.data.id, clinicId, from: starts_at, to: ends_at });
  }

  async function onConfirmBlock() {
    if (!staffQuery.data || !range) return;
    await createTimeOff.mutateAsync({
      doctor_id: staffQuery.data.id,
      clinic_id: range.clinic_id,
      starts_at: range.starts_at,
      ends_at: range.ends_at,
      reason: watch("reason") || null,
    });
    setAnnounce(es.admin.bloqueos.guardadoOk);
    setRange(null);
  }

  async function onCancelAffected(appt: AppointmentWithDetails) {
    await cancelAppointment.mutateAsync({ id: appt.id, reason: "Bloqueo de agenda" });
    setResolvedIds((prev) => new Set(prev).add(appt.id));
  }

  const timeOffList = timeOffQuery.data ?? [];

  return (
    <AdminLayout>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.admin.bloqueos.titulo}
      </h1>

      <section className="mt-4">
        {timeOffQuery.isLoading ? (
          <p className="text-muted" role="status">
            {es.common.cargando}
          </p>
        ) : timeOffList.length === 0 ? (
          <p className="text-muted">{es.admin.bloqueos.vacio}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timeOffList.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
                <span className="text-sm text-ink">
                  {formatClinicDateTime(t.starts_at, "d MMM h:mm a")} — {formatClinicDateTime(t.ends_at, "d MMM h:mm a")}
                  {t.reason ? ` · ${t.reason}` : ""}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await removeTimeOff.mutateAsync(t.id);
                    setAnnounce(es.admin.bloqueos.eliminarOk);
                  }}
                  className="text-sm text-muted hover:text-danger"
                >
                  {es.common.eliminar}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">{es.admin.bloqueos.agregar}</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onPreview)} noValidate>
          <div className="flex gap-3">
            <Field label={es.admin.bloqueos.desdeLabel} isRequired inputProps={{ type: "date", ...register("from_date") }} />
            <Field label={es.admin.bloqueos.hastaLabel} isRequired inputProps={{ type: "date", ...register("to_date") }} />
          </div>
          <Controller
            control={control}
            name="all_day"
            render={({ field }) => (
              <Checkbox isSelected={field.value} onChange={field.onChange}>
                {es.admin.bloqueos.todoElDia}
              </Checkbox>
            )}
          />
          {!allDay ? (
            <div className="flex gap-3">
              <Field label={es.admin.horarios.desdeLabel} inputProps={{ type: "time", ...register("from_time") }} />
              <Field label={es.admin.horarios.hastaLabel} inputProps={{ type: "time", ...register("to_time") }} />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="clinic_id" className="text-sm font-medium text-ink">
              {es.admin.bloqueos.clinicaLabel}
            </label>
            <select
              id="clinic_id"
              {...register("clinic_id")}
              className="min-h-tap rounded-sm border border-border-ui bg-surface px-3 text-[15px] text-ink"
            >
              <option value="">{es.admin.bloqueos.todasLasClinicas}</option>
              {(clinicsQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field label={es.admin.bloqueos.motivoLabel} inputProps={register("reason")} />
          {formState.errors.to_date ? <p className="text-sm text-danger">{formState.errors.to_date.message}</p> : null}
          <Button type="submit" variant="secondary" isPending={affected.isPending} className="self-start">
            {es.admin.bloqueos.guardarYVer}
          </Button>
        </form>

        {range ? (
          <div className="mt-6 rounded-md border border-line bg-surface p-4">
            <h3 className="font-medium text-ink">{es.admin.bloqueos.impactoTitulo}</h3>
            {affected.isPending ? (
              <p className="mt-2 text-muted" role="status">
                {es.common.cargando}
              </p>
            ) : (affected.data ?? []).length === 0 ? (
              <p className="mt-2 text-muted">{es.admin.bloqueos.impactoVacio}</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">{es.admin.bloqueos.impactoDescripcion}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {(affected.data ?? []).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-sm border border-line p-2">
                      <span className="text-sm text-ink">
                        {formatClinicDateTime(a.starts_at, "d MMM h:mm a")} — {a.patient.full_name}
                      </span>
                      {resolvedIds.has(a.id) ? (
                        <span className="text-sm text-success">✓</span>
                      ) : (
                        <span className="flex gap-2">
                          <Button variant="quiet" onPress={() => setReschedulingAppt(a)}>
                            {es.admin.bloqueos.accionMover}
                          </Button>
                          <Button variant="quiet" onPress={() => onCancelAffected(a)}>
                            {es.admin.bloqueos.accionCancelar}
                          </Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Button variant="primary" className="mt-4" onPress={onConfirmBlock} isPending={createTimeOff.isPending}>
              {es.admin.bloqueos.confirmarBloqueo}
            </Button>
          </div>
        ) : null}
      </section>

      {reschedulingAppt ? (
        <RescheduleSheet
          isOpen
          onOpenChange={(open) => !open && setReschedulingAppt(null)}
          clinicId={reschedulingAppt.clinic_id}
          doctorId={reschedulingAppt.doctor_id}
          typeId={reschedulingAppt.type_id}
          onSelect={async (slot: SlotRow) => {
            await rescheduleAppointment.mutateAsync({ id: reschedulingAppt.id, newStart: slot.slot_start });
            setResolvedIds((prev) => new Set(prev).add(reschedulingAppt.id));
            setReschedulingAppt(null);
          }}
        />
      ) : null}

      <LiveRegion message={announce} />
    </AdminLayout>
  );
}
