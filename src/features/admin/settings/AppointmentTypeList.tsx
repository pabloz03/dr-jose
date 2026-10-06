import { useState } from "react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminAppointmentTypes } from "./queries";
import { AppointmentTypeFormDialog } from "./AppointmentTypeFormDialog";
import type { Tables } from "@/lib/database.types";

export function AppointmentTypeList() {
  const typesQuery = useAdminAppointmentTypes();
  const [editing, setEditing] = useState<Tables<"appointment_types"> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const types = typesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      {typesQuery.isLoading ? (
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : types.length === 0 ? (
        <p className="text-muted">{es.admin.ajustes.tipoVacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {types.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{t.name}</span>
                <span className="text-sm text-muted">{t.duration_min} min</span>
                {!t.is_active ? (
                  <Badge tone="neutral" icon="●">
                    Inactivo
                  </Badge>
                ) : null}
              </div>
              <Button variant="quiet" onPress={() => setEditing(t)}>
                {es.common.editar}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onPress={() => setIsAdding(true)} className="self-start">
        {es.admin.ajustes.tipoAgregar}
      </Button>
      {isAdding ? <AppointmentTypeFormDialog isOpen onOpenChange={setIsAdding} /> : null}
      {editing ? (
        <AppointmentTypeFormDialog type={editing} isOpen onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}
    </div>
  );
}
