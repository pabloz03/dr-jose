import { useState } from "react";
import { motion } from "motion/react";
import { Clock3, ListChecks, Pencil, Plus } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cardEnter, staggerList } from "@/lib/motion";
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
        <SkeletonList count={3} />
      ) : types.length === 0 ? (
        // Sin `action`: el botón "Agregar tipo de cita" ya queda justo
        // debajo (persistente), duplicarlo aquí sería un CTA redundante.
        <EmptyState
          icon={<ListChecks aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
          title={es.admin.ajustes.tipoVacio}
        />
      ) : (
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="flex flex-col gap-2">
          {types.map((t) => (
            <motion.li key={t.id} variants={cardEnter}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{t.name}</span>
                    <span className="flex items-center gap-1 text-sm text-muted">
                      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
                      {t.duration_min} min
                    </span>
                    {!t.is_active ? (
                      <Badge tone="neutral" icon="●">
                        Inactivo
                      </Badge>
                    ) : null}
                  </div>
                  <Button variant="quiet" onPress={() => setEditing(t)}>
                    <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                    {es.common.editar}
                  </Button>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}
      <Button variant="secondary" onPress={() => setIsAdding(true)} className="self-start">
        <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.admin.ajustes.tipoAgregar}
      </Button>
      {isAdding ? <AppointmentTypeFormDialog isOpen onOpenChange={setIsAdding} /> : null}
      {editing ? (
        <AppointmentTypeFormDialog type={editing} isOpen onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}
    </div>
  );
}
