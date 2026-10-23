import { useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { es } from "@/i18n/es";
import { Sheet } from "@/components/ui/Sheet";
import { useAdminClinic } from "./AdminClinicContext";

/**
 * Selector compacto de clínica activa — sustituye la fila de chips
 * "Todas las clínicas / Clínica A / Clínica B" por un solo botón +
 * hoja inferior (patrón "Elegir clínica" del Figma admin). Solo para
 * pantallas que usan `useAdminClinic()` (Hoy/Calendario/Métricas/
 * Pacientes, donde "Todas las clínicas" es una vista válida) — las
 * que necesitan una clínica concreta (`useResolvedAdminClinic`, p.
 * ej. Horarios/Ajustes) no muestran la opción "todas" aquí, así que
 * usan su propio selector sin esa fila.
 */
export function AdminClinicSelector() {
  const { clinics, selectedId, setSelectedId } = useAdminClinic();
  const [isOpen, setIsOpen] = useState(false);

  if (clinics.length <= 1) return null;

  const activeLabel = selectedId === "all" ? es.admin.hoy.todasLasClinicas : (clinics.find((c) => c.id === selectedId)?.name ?? "");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-tap items-center gap-1.5 text-sm font-medium text-accent"
      >
        <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        {activeLabel}
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      </button>

      <Sheet title={es.admin.elegirClinica.titulo} isOpen={isOpen} onOpenChange={setIsOpen}>
        <nav aria-label={es.admin.elegirClinica.titulo} className="flex flex-col divide-y divide-line">
          <button
            type="button"
            onClick={() => {
              setSelectedId("all");
              setIsOpen(false);
            }}
            className="flex min-h-tap items-center gap-3 py-3 text-left text-ink"
          >
            <Building2 aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} />
            <span className="flex-1 font-medium">{es.admin.hoy.todasLasClinicas}</span>
            {selectedId === "all" ? (
              <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.5} />
            ) : (
              <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-[var(--r-pill)] border border-border-ui" />
            )}
          </button>
          {clinics.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedId(c.id);
                setIsOpen(false);
              }}
              className="flex min-h-tap items-center gap-3 py-3 text-left text-ink"
            >
              <Building2 aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} />
              <span className="flex-1 font-medium">{c.name}</span>
              {selectedId === c.id ? (
                <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.5} />
              ) : (
                <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-[var(--r-pill)] border border-border-ui" />
              )}
            </button>
          ))}
        </nav>
      </Sheet>
    </>
  );
}
