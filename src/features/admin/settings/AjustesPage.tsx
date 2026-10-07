import { useEffect, useRef } from "react";
import { ListChecks, Settings, SlidersHorizontal } from "lucide-react";
import { es } from "@/i18n/es";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinicSelection } from "../useAdminClinicSelection";
import { RulesForm } from "./RulesForm";
import { AppointmentTypeList } from "./AppointmentTypeList";

export function AjustesPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { clinics, isLoading, selectedId, setSelectedId, selectedClinic } = useAdminClinicSelection();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AdminLayout>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display flex items-center gap-2 text-2xl text-ink outline-none"
      >
        <Settings aria-hidden="true" className="h-6 w-6 text-accent" strokeWidth={2.25} />
        {es.admin.ajustes.titulo}
      </h1>

      {isLoading ? (
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

      {selectedClinic ? (
        <>
          <section className="mt-6">
            <h2 className="font-display flex items-center gap-1.5 text-lg text-ink">
              <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.reglasTitulo}
            </h2>
            <div className="mt-3">
              <RulesForm clinicId={selectedClinic.id} />
            </div>
          </section>

          <section className="mt-8 border-t border-line pt-6">
            <h2 className="font-display flex items-center gap-1.5 text-lg text-ink">
              <ListChecks aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.tiposTitulo}
            </h2>
            <div className="mt-3">
              <AppointmentTypeList />
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
}
