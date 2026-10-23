import { useState } from "react";
import { motion } from "motion/react";
import { Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { showToast } from "@/components/ui/Toast";
import { cardEnter, staggerList } from "@/lib/motion";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { useAdminClinics, useDeleteClinic, ClinicHasAppointmentsError } from "./queries";
import { ClinicFormDialog } from "./ClinicFormDialog";
import type { Tables } from "@/lib/database.types";

export function ClinicsPage() {
  const clinicsQuery = useAdminClinics();
  const deleteClinic = useDeleteClinic();
  const [editing, setEditing] = useState<Tables<"clinics"> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState<Tables<"clinics"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onConfirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deleteClinic.mutateAsync(deleting.id);
      setDeleting(null);
      showToast({ title: es.admin.clinicas.eliminadaOk, tone: "success" });
    } catch (error) {
      setDeleteError(
        error instanceof ClinicHasAppointmentsError ? es.admin.clinicas.errorTieneCitas : es.common.errorAccionGenerico,
      );
    }
  }

  const clinics = clinicsQuery.data ?? [];

  return (
    <AdminLayout>
      <AdminScreenHeader icon={Stethoscope} title={es.admin.clinicas.titulo} />

      <Button variant="primary" size="lg" className="w-full lg:w-auto" onPress={() => setIsAdding(true)}>
        <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.admin.clinicas.agregar}
      </Button>

      {clinicsQuery.isLoading ? (
        <SkeletonList count={3} />
      ) : clinicsQuery.isError ? (
        <ErrorState onRetry={() => clinicsQuery.refetch()} />
      ) : clinics.length === 0 ? (
        <EmptyState
          icon={<Stethoscope aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
          title={es.admin.clinicas.vacio}
          action={{ label: es.admin.clinicas.agregar, onPress: () => setIsAdding(true) }}
        />
      ) : (
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
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
                  <div className="flex items-center gap-1">
                    <Button variant="quiet" onPress={() => setEditing(clinic)}>
                      <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                      {es.common.editar}
                    </Button>
                    <Button
                      variant="quiet"
                      onPress={() => {
                        setDeleteError(null);
                        setDeleting(clinic);
                      }}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4 text-danger" strokeWidth={2.25} />
                      {es.common.eliminar}
                    </Button>
                  </div>
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
      {deleting ? (
        <Dialog
          title={es.admin.clinicas.confirmarEliminarTitulo}
          isOpen
          isDismissable
          onOpenChange={(open) => !open && setDeleting(null)}
        >
          <p className="text-sm text-ink">{es.admin.clinicas.confirmarEliminarCuerpo(deleting.name)}</p>
          {deleteError ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="quiet" onPress={() => setDeleting(null)}>
              {es.common.cancelar}
            </Button>
            <Button variant="danger" onPress={onConfirmDelete} isPending={deleteClinic.isPending}>
              <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.common.eliminar}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </AdminLayout>
  );
}
