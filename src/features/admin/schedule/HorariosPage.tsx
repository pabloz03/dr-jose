import { useEffect, useRef } from "react";
import { CalendarCog, Clock } from "lucide-react";
import { es } from "@/i18n/es";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinicSelection } from "../useAdminClinicSelection";
import { WeeklySchedule } from "./WeeklySchedule";
import { ExceptionsManager } from "./ExceptionsManager";

export function HorariosPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const staffQuery = useMyStaff();
  const { clinics, isLoading, selectedId, setSelectedId, selectedClinic } = useAdminClinicSelection();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AdminLayout>
      <Eyebrow>{es.admin.nav.horarios}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
      >
        <Clock aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {es.admin.horarios.titulo}
      </h1>

      {isLoading || staffQuery.isLoading ? (
        <p className="mt-6 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : clinics.length > 1 ? (
        <div className="mt-6 flex gap-2">
          {clinics.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${c.id === selectedId ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      {selectedClinic && staffQuery.data ? (
        <>
          <section className="mt-8">
            <WeeklySchedule clinicId={selectedClinic.id} doctorId={staffQuery.data.id} />
          </section>

          <section className="mt-10 border-t border-line pt-8">
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
