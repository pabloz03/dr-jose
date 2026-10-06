import { useEffect, useRef } from "react";
import { es } from "@/i18n/es";
import { useMyStaff } from "@/features/auth/useMyStaff";
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
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.admin.horarios.titulo}
      </h1>

      {isLoading || staffQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : clinics.length > 1 ? (
        <div className="mt-4 flex gap-2">
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
          <section className="mt-6">
            <WeeklySchedule clinicId={selectedClinic.id} doctorId={staffQuery.data.id} />
          </section>

          <section className="mt-8 border-t border-line pt-6">
            <h2 className="text-lg font-semibold text-ink">{es.admin.horarios.excepcionesTitulo}</h2>
            <div className="mt-3">
              <ExceptionsManager clinicId={selectedClinic.id} doctorId={staffQuery.data.id} />
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
}
