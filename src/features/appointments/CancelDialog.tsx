import { useState } from "react";
import { es } from "@/i18n/es";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function CancelDialog({
  isOpen,
  onOpenChange,
  isPending,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog title={es.citas.cancelarTitulo} isOpen={isOpen} isDismissable onOpenChange={onOpenChange}>
      <p className="text-sm text-muted">{es.citas.cancelarAyuda}</p>
      <div className="mt-4">
        <Field
          label={es.citas.motivoLabel}
          inputProps={{ value: reason, onChange: (e) => setReason(e.target.value) }}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="quiet" onPress={() => onOpenChange(false)}>
          {es.citas.cancelarNoVolver}
        </Button>
        <Button variant="danger" onPress={() => onConfirm(reason)} isPending={isPending}>
          {es.citas.cancelarConfirmar}
        </Button>
      </div>
    </Dialog>
  );
}
