import { ListChecks, Settings, SlidersHorizontal } from "lucide-react";
import { es } from "@/i18n/es";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { useResolvedAdminClinic } from "../AdminClinicContext";
import { RulesForm } from "./RulesForm";
import { AppointmentTypeList } from "./AppointmentTypeList";

export function AjustesPage() {
  const { clinics, isLoading, selectedId, setSelectedId, selectedClinic } = useResolvedAdminClinic();

  return (
    <AdminLayout>
      <AdminScreenHeader icon={Settings} title={es.admin.ajustes.titulo} />

      {isLoading ? (
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

      {selectedClinic ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <section>
            <h2 className="font-display flex items-center gap-2 text-xl text-ink">
              <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.reglasTitulo}
            </h2>
            <div className="mt-4">
              <RulesForm clinicId={selectedClinic.id} />
            </div>
          </section>

          <section className="border-t border-line pt-8 lg:border-t-0 lg:pt-0">
            <h2 className="font-display flex items-center gap-2 text-xl text-ink">
              <ListChecks aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
              {es.admin.ajustes.tiposTitulo}
            </h2>
            <div className="mt-4">
              <AppointmentTypeList />
            </div>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
