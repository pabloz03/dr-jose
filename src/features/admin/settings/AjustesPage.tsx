import { useEffect, useRef } from "react";
import { ListChecks, Settings, SlidersHorizontal } from "lucide-react";
import { es } from "@/i18n/es";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminLayout } from "../AdminLayout";
import { useResolvedAdminClinic } from "../AdminClinicContext";
import { RulesForm } from "./RulesForm";
import { AppointmentTypeList } from "./AppointmentTypeList";

export function AjustesPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { clinics, isLoading, selectedId, setSelectedId, selectedClinic } = useResolvedAdminClinic();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AdminLayout>
      <Eyebrow>{es.admin.nav.ajustes}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
      >
        <Settings aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {es.admin.ajustes.titulo}
      </h1>

      {isLoading ? (
        <Skeleton className="mt-6 h-10 w-64" />
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

      {selectedClinic ? (
        <>
          <section className="mt-8">
            <h2 className="font-display flex items-center gap-2 text-xl text-ink">
              <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.reglasTitulo}
            </h2>
            <div className="mt-4">
              <RulesForm clinicId={selectedClinic.id} />
            </div>
          </section>

          <section className="mt-10 border-t border-line pt-8">
            <h2 className="font-display flex items-center gap-2 text-xl text-ink">
              <ListChecks aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.tiposTitulo}
            </h2>
            <div className="mt-4">
              <AppointmentTypeList />
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
}
