import { useEffect, useRef, useState } from "react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinics } from "./queries";
import { ClinicFormDialog } from "./ClinicFormDialog";
import type { Tables } from "@/lib/database.types";

export function ClinicsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clinicsQuery = useAdminClinics();
  const [editing, setEditing] = useState<Tables<"clinics"> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const clinics = clinicsQuery.data ?? [];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          {es.admin.clinicas.titulo}
        </h1>
        <Button variant="primary" onPress={() => setIsAdding(true)}>
          {es.admin.clinicas.agregar}
        </Button>
      </div>

      {clinicsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : clinics.length === 0 ? (
        <p className="mt-4 text-muted">{es.admin.clinicas.vacio}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {clinics.map((clinic) => (
            <li
              key={clinic.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{clinic.name}</span>
                {!clinic.is_active ? (
                  <Badge tone="neutral" icon="●">
                    Inactiva
                  </Badge>
                ) : null}
              </div>
              <Button variant="quiet" onPress={() => setEditing(clinic)}>
                {es.common.editar}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isAdding ? <ClinicFormDialog isOpen onOpenChange={setIsAdding} /> : null}
      {editing ? (
        <ClinicFormDialog clinic={editing} isOpen onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}
    </AdminLayout>
  );
}
