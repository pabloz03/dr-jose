import { CalendarCog, Clock } from "lucide-react";
import { es } from "@/i18n/es";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { useResolvedAdminClinic } from "../AdminClinicContext";
import { WeeklySchedule } from "./WeeklySchedule";
import { ExceptionsManager } from "./ExceptionsManager";

export function HorariosPage() {
  const staffQuery = useMyStaff();
  const { clinics, isLoading, selectedId, setSelectedId, selectedClinic } = useResolvedAdminClinic();

  return (
    <AdminLayout>
      <AdminScreenHeader icon={Clock} title={es.admin.horarios.titulo} />

      {isLoading || staffQuery.isLoading ? (
        <Skeleton className="h-10 w-64" />
      ) : clinics.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {clinics.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === selectedId}
              onClick={() => setSelectedId(c.id)}
              className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${c.id === selectedId ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      {!isLoading && !staffQuery.isLoading && staffQuery.isError ? (
        <ErrorState onRetry={() => staffQuery.refetch()} />
      ) : null}

      {selectedClinic && staffQuery.data ? (
        <>
          <section>
            <WeeklySchedule clinicId={selectedClinic.id} doctorId={staffQuery.data.id} />
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display flex items-center gap-2 text-xl text-ink">
              <CalendarCog aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.horarios.excepcionesTitulo}
            </h2>
            <div className="mt-4">
              <ExceptionsManager clinicId={selectedClinic.id} doctorId={staffQuery.data.id} />
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
}
