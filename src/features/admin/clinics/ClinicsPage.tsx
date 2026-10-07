import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pencil, Plus, Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cardEnter, staggerList } from "@/lib/motion";
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
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display flex items-center gap-2 text-2xl text-ink outline-none"
        >
          <Stethoscope aria-hidden="true" className="h-6 w-6 text-accent" strokeWidth={2.25} />
          {es.admin.clinicas.titulo}
        </h1>
        <Button variant="primary" onPress={() => setIsAdding(true)}>
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
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
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="mt-4 flex flex-col gap-2">
          {clinics.map((clinic) => (
            <motion.li key={clinic.id} variants={cardEnter}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{clinic.name}</span>
                    {!clinic.is_active ? (
                      <Badge tone="neutral" icon="●">
                        Inactiva
                      </Badge>
                    ) : null}
                  </div>
                  <Button variant="quiet" onPress={() => setEditing(clinic)}>
                    <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                    {es.common.editar}
                  </Button>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}

      {isAdding ? <ClinicFormDialog isOpen onOpenChange={setIsAdding} /> : null}
      {editing ? (
        <ClinicFormDialog clinic={editing} isOpen onOpenChange={(open) => !open && setEditing(null)} />
      ) : null}
    </AdminLayout>
  );
}
