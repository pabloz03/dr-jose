import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { showToast } from "@/components/ui/Toast";
import { usePatients, useRemovePatient } from "./queries";
import { PatientFormDialog } from "./PatientFormDialog";
import type { Tables } from "@/lib/database.types";

type Patient = Tables<"patients">;

export function PatientList() {
  const patientsQuery = usePatients();
  const removePatient = useRemovePatient();
  const [editing, setEditing] = useState<Patient | null>(null);
  const [removing, setRemoving] = useState<Patient | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function onRemove(patient: Patient) {
    setRemoveError(null);
    try {
      await removePatient.mutateAsync(patient.id);
      setRemoving(null);
      showToast({ title: es.familia.eliminado, tone: "success" });
    } catch {
      setRemoveError(es.common.errorAccionGenerico);
    }
  }

  if (patientsQuery.isLoading) {
    return <SkeletonList count={2} />;
  }

  if (patientsQuery.isError) {
    return <ErrorState title="No pudimos cargar sus pacientes." onRetry={() => patientsQuery.refetch()} />;
  }

  const patients = patientsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      {patients.length === 0 ? (
        <EmptyState icon={<UserRound className="h-8 w-8" strokeWidth={2.25} />} title={es.familia.vacio} />
      ) : (
        <ul className="flex flex-col gap-2">
          {patients.map((p) => (
            <li key={p.id}>
              <Card className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
                  <span className="font-medium text-ink">{p.full_name}</span>
                  {p.is_self ? (
                    <Badge tone="neutral" icon={<UserRound className="h-3.5 w-3.5" strokeWidth={2.5} />}>
                      {es.familia.esUsted}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="quiet" onPress={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    {es.common.editar}
                  </Button>
                  <Button variant="quiet" onPress={() => setRemoving(p)}>
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    {es.common.eliminar}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" onPress={() => setIsAdding(true)} className="self-start">
        <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {es.familia.agregarPaciente}
      </Button>

      {isAdding ? <PatientFormDialog isOpen onOpenChange={setIsAdding} /> : null}
      {editing ? <PatientFormDialog isOpen patient={editing} onOpenChange={(open) => !open && setEditing(null)} /> : null}

      {removing ? (
        <Dialog
          title={es.common.eliminar}
          isOpen
          isDismissable
          onOpenChange={(open) => !open && setRemoving(null)}
        >
          <p className="text-sm text-ink">{es.familia.confirmarEliminar(removing.full_name)}</p>
          {removeError ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {removeError}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="quiet" onPress={() => setRemoving(null)}>
              {es.common.cancelar}
            </Button>
            <Button variant="danger" onPress={() => onRemove(removing)} isPending={removePatient.isPending}>
              <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {es.common.eliminar}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
