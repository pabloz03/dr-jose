import { useEffect, useMemo, useRef, useState } from "react";
import { today, type CalendarDate } from "@internationalized/date";
import { CalendarDays, CalendarRange, CalendarX2, ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Calendar } from "@/components/ui/Calendar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinic } from "../AdminClinicContext";
import { useAdminAppointmentsRange } from "../appointments/queries";
import { AdminAppointmentRow } from "../appointments/AdminAppointmentRow";
import { dayRangeUtc, weekRangeUtc, monthRangeUtc, weekDays } from "./dateRanges";

type View = "dia" | "semana" | "mes";

export function CalendarPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const staffQuery = useMyStaff();
  const { clinics, selectedId, setSelectedId } = useAdminClinic();
  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.innerWidth >= 768 ? "semana" : "dia"));
  const [selected, setSelected] = useState<CalendarDate>(today(CLINIC_TZ));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const range = useMemo(() => {
    if (view === "dia") return dayRangeUtc(selected);
    if (view === "semana") return weekRangeUtc(selected);
    return monthRangeUtc(selected);
  }, [view, selected]);

  const appointmentsQuery = useAdminAppointmentsRange(staffQuery.data?.id, range.from, range.to, selectedId);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof appointmentsQuery.data>>();
    for (const a of appointmentsQuery.data ?? []) {
      const key = formatClinicDateTime(a.starts_at, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointmentsQuery.data]);

  const viewIcon: Record<View, typeof CalendarDays> = {
    dia: CalendarDays,
    semana: CalendarRange,
    mes: Grid3x3,
  };

  return (
    <AdminLayout wide>
      <Eyebrow>{es.admin.nav.calendario}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
      >
        <CalendarRange aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {es.admin.calendario.titulo}
      </h1>

      {clinics.length > 1 ? (
        <div role="group" aria-label={es.admin.calendario.filtrarPorClinica} className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={selectedId === "all"}
            onClick={() => setSelectedId("all")}
            className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${selectedId === "all" ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
          >
            {es.admin.calendario.todasLasClinicas}
          </button>
          {clinics.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={selectedId === c.id}
              onClick={() => setSelectedId(c.id)}
              className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${selectedId === c.id ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div role="group" aria-label={es.admin.calendario.titulo} className="mt-6 flex gap-2">
        {(["dia", "semana", "mes"] as const).map((v) => {
          const Icon = viewIcon[v];
          return (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`inline-flex min-h-tap items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm ${view === v ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {v === "dia" ? es.admin.calendario.vistaDia : v === "semana" ? es.admin.calendario.vistaSemana : es.admin.calendario.vistaMes}
            </button>
          );
        })}
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="mt-6">
          <SkeletonList count={4} />
        </div>
      ) : view === "mes" ? (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:gap-10">
          <Calendar
            aria-label={es.admin.calendario.vistaMes}
            value={selected}
            onChange={setSelected}
            hasIndicator={(d) => appointmentsByDate.has(d.toString())}
          />
          <div className="flex-1">
            <h2 className="font-display text-lg text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "d 'de' MMMM")}
            </h2>
            <DayAppointments
              list={appointmentsByDate.get(selected.toString()) ?? []}
              isError={appointmentsQuery.isError}
              onRetry={() => appointmentsQuery.refetch()}
            />
          </div>
        </div>
      ) : view === "semana" ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-7">
          {weekDays(selected).map((d) => (
            <div key={d.toString()} className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">
                {formatClinicDateTime(`${d.toString()}T12:00:00`, "EEE d")}
              </h2>
              <div className="mt-2 flex min-w-0 flex-col gap-1.5">
                <DayAppointments
                  list={appointmentsByDate.get(d.toString()) ?? []}
                  isError={appointmentsQuery.isError}
                  onRetry={() => appointmentsQuery.refetch()}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(selected.subtract({ days: 1 }))}
              className="inline-flex min-h-tap items-center gap-1 rounded-sm border border-line px-3 text-sm text-ink"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.admin.calendario.anterior}
            </button>
            <span className="font-medium text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "EEEE d 'de' MMMM")}
            </span>
            <button
              type="button"
              onClick={() => setSelected(selected.add({ days: 1 }))}
              className="inline-flex min-h-tap items-center gap-1 rounded-sm border border-line px-3 text-sm text-ink"
            >
              {es.admin.calendario.siguiente}
              <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          <DayAppointments
            list={appointmentsByDate.get(selected.toString()) ?? []}
            isError={appointmentsQuery.isError}
            onRetry={() => appointmentsQuery.refetch()}
          />
        </div>
      )}
    </AdminLayout>
  );
}

function DayAppointments({
  list,
  compact,
  isError,
  onRetry,
}: {
  list: ReturnType<typeof useAdminAppointmentsRange>["data"];
  compact?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const items = list ?? [];
  // El grid/calendario nunca se reemplaza por un error: solo esta lista de
  // citas del día/rango seleccionado refleja que la consulta falló.
  if (isError) {
    if (compact) {
      return (
        <p className="mt-2 flex flex-col items-start gap-1 text-sm text-danger" role="alert">
          {es.common.errorCargaGenerico}
          {onRetry ? (
            <button type="button" onClick={onRetry} className="min-h-tap inline-flex items-center underline">
              {es.common.reintentar}
            </button>
          ) : null}
        </p>
      );
    }
    return (
      <div className="mt-2">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }
  if (items.length === 0) {
    // En vista semana cada celda es parte de la grilla del calendario; un
    // EmptyState completo por celda sería un reemplazo estructural de esa
    // grilla, así que esa variante compacta conserva el texto simple.
    if (compact) {
      return <p className="mt-2 text-sm text-muted">{es.admin.calendario.vacio}</p>;
    }
    return (
      <div className="mt-2">
        <EmptyState
          icon={<CalendarX2 aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
          title={es.admin.calendario.vacio}
        />
      </div>
    );
  }
  if (compact) {
    return (
      <>
        {items.map((a) => (
          <AdminAppointmentRow key={a.id} appointment={a} compact />
        ))}
      </>
    );
  }
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {items.map((a) => (
        <li key={a.id}>
          <AdminAppointmentRow appointment={a} />
        </li>
      ))}
    </ul>
  );
}
