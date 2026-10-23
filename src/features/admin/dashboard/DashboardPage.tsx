import { useMemo, useState } from "react";
import { today } from "@internationalized/date";
import { BarChart3, TrendingUp } from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ } from "@/lib/tz";
import type { Database } from "@/lib/database.types";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { AdminClinicSelector } from "../AdminClinicSelector";
import { monthRangeUtc } from "../calendar/dateRanges";
import { useDashboardAppointmentMetrics, useDashboardNewPatients } from "./queries";
import { useAdminClinic } from "../AdminClinicContext";
import { bucketKey, bucketLabel, trailingBucketKeys, type Granularity } from "./bucketing";
import { TrendChart } from "./TrendChart";
import { StatusBreakdown } from "./StatusBreakdown";
import { TypeBreakdown } from "./TypeBreakdown";

type Section = "resumen" | "tendencia" | "porEstado" | "porTipo";

type Status = Database["public"]["Enums"]["appointment_status"];

const MIN_FOR_TREND = 10;
const TRAILING_WEEKS = 8;
const TRAILING_MONTHS = 6;

function pctValue(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums text-ink">{value}</span>
      {sub ? <span className="text-xs text-muted">{sub}</span> : null}
    </Card>
  );
}

export function DashboardPage() {
  const [granularity, setGranularity] = useState<Granularity>("semana");
  const [section, setSection] = useState<Section>("resumen");
  const { selectedId: filter } = useAdminClinic();

  // Rango fijo de 6 meses (el mes actual + 5 anteriores) — un solo fetch
  // sirve tanto para la vista semana como mes y para cualquier clínica,
  // nunca se vuelve a pedir al cambiar el toggle o el filtro.
  const { from, to } = useMemo(() => {
    const now = today(CLINIC_TZ);
    return {
      from: monthRangeUtc(now.subtract({ months: TRAILING_MONTHS - 1 })).from,
      to: monthRangeUtc(now).to,
    };
  }, []);

  const appointmentsQuery = useDashboardAppointmentMetrics(from, to);
  const newPatientsQuery = useDashboardNewPatients(from, to);

  const isLoading = appointmentsQuery.isLoading || newPatientsQuery.isLoading;
  const isError = appointmentsQuery.isError || newPatientsQuery.isError;

  const filteredRows = useMemo(() => {
    const rows = appointmentsQuery.data ?? [];
    return filter === "all" ? rows : rows.filter((r) => r.clinic_id === filter);
  }, [appointmentsQuery.data, filter]);

  const totals = useMemo(() => {
    const counts: Record<Status, number> = {
      scheduled: 0,
      confirmed: 0,
      cancelled: 0,
      rescheduled: 0,
      completed: 0,
      no_show: 0,
    };
    let total = 0;
    let confirmedCount = 0;
    for (const row of filteredRows) {
      counts[row.status] += row.n_appointments;
      total += row.n_appointments;
      confirmedCount += row.n_confirmed;
    }
    return { counts, total, confirmedCount };
  }, [filteredRows]);

  const typeTotals = useMemo(() => {
    const map = new Map<string, { type_id: string; type_name: string; n: number }>();
    for (const row of filteredRows) {
      const existing = map.get(row.type_id);
      if (existing) existing.n += row.n_appointments;
      else map.set(row.type_id, { type_id: row.type_id, type_name: row.type_name, n: row.n_appointments });
    }
    return [...map.values()];
  }, [filteredRows]);

  const trendBuckets = useMemo(() => {
    const count = granularity === "semana" ? TRAILING_WEEKS : TRAILING_MONTHS;
    const keys = trailingBucketKeys(today(CLINIC_TZ), granularity, count);
    const sums = new Map<string, number>();
    for (const row of filteredRows) {
      const key = bucketKey(row.day, granularity);
      sums.set(key, (sums.get(key) ?? 0) + row.n_appointments);
    }
    return keys.map((key) => ({ key, label: bucketLabel(key, granularity), total: sums.get(key) ?? 0 }));
  }, [filteredRows, granularity]);

  const newPatientsTotal = useMemo(
    () => (newPatientsQuery.data ?? []).reduce((sum, row) => sum + row.n_new_patients, 0),
    [newPatientsQuery.data],
  );

  function retry() {
    appointmentsQuery.refetch();
    newPatientsQuery.refetch();
  }

  return (
    <AdminLayout wide>
      <AdminScreenHeader icon={BarChart3} title={es.admin.dashboard.titulo} />
      <AdminClinicSelector />

      <SegmentedControl
        aria-label={es.admin.dashboard.agruparPor}
        value={granularity}
        onChange={setGranularity}
        className="max-w-xs"
        options={[
          { value: "semana", label: es.admin.dashboard.vistaSemana },
          { value: "mes", label: es.admin.dashboard.vistaMes },
        ]}
      />

      <SegmentedControl
        aria-label={es.admin.dashboard.secciones}
        value={section}
        onChange={setSection}
        className="lg:hidden"
        options={[
          { value: "resumen", label: es.admin.dashboard.tabResumen },
          { value: "tendencia", label: es.admin.dashboard.tabTendencia },
          { value: "porEstado", label: es.admin.dashboard.tabPorEstado },
          { value: "porTipo", label: es.admin.dashboard.tabPorTipo },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={retry} />
      ) : (
        <>
          <div className={section === "resumen" ? "block" : "hidden lg:block"}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              <KpiCard label={es.admin.dashboard.totalCitas} value={totals.total} />
              <KpiCard
                label={es.admin.dashboard.completadas}
                value={totals.counts.completed}
                sub={es.admin.dashboard.porcentajeDelTotal(pctValue(totals.counts.completed, totals.total))}
              />
              <KpiCard
                label={es.admin.dashboard.canceladas}
                value={totals.counts.cancelled}
                sub={es.admin.dashboard.porcentajeDelTotal(pctValue(totals.counts.cancelled, totals.total))}
              />
              <KpiCard
                label={es.admin.dashboard.noShow}
                value={totals.counts.no_show}
                sub={es.admin.dashboard.porcentajeDelTotal(pctValue(totals.counts.no_show, totals.total))}
              />
              <KpiCard
                label={es.admin.dashboard.tasaConfirmacion}
                value={`${pctValue(totals.confirmedCount, totals.total)}%`}
              />
              {filter === "all" ? (
                <KpiCard label={es.admin.dashboard.pacientesNuevos} value={newPatientsTotal} />
              ) : (
                <Card className="flex items-center">
                  <p className="text-sm text-muted">{es.admin.dashboard.pacientesNuevosNoDisponiblePorClinica}</p>
                </Card>
              )}
            </div>

            {totals.total < MIN_FOR_TREND ? (
              <p className="mt-4 text-sm text-muted" role="status">
                {es.admin.dashboard.pocosDatosAviso(totals.total)}
              </p>
            ) : null}
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            <section className={section === "tendencia" ? "block" : "hidden lg:block"}>
              <h2 className="font-display text-lg text-ink">{es.admin.dashboard.tendenciaTitulo}</h2>
              {totals.total < MIN_FOR_TREND ? (
                <div className="mt-4">
                  <EmptyState
                    icon={<TrendingUp aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
                    title={es.admin.dashboard.tendenciaVacio}
                    description={es.admin.dashboard.tendenciaVacioDescripcion}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <TrendChart buckets={trendBuckets} />
                </div>
              )}
            </section>

            <section className={section === "porEstado" ? "block" : "hidden lg:block"}>
              <h2 className="font-display text-lg text-ink">{es.admin.dashboard.porEstadoTitulo}</h2>
              <div className="mt-4">
                <StatusBreakdown counts={totals.counts} />
              </div>
            </section>

            <section className={section === "porTipo" ? "block" : "hidden lg:block"}>
              <h2 className="font-display text-lg text-ink">{es.admin.dashboard.porTipoTitulo}</h2>
              <div className="mt-4">
                {typeTotals.length === 0 ? (
                  <p className="text-sm text-muted">{es.admin.dashboard.sinTipos}</p>
                ) : (
                  <TypeBreakdown rows={typeTotals} />
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
