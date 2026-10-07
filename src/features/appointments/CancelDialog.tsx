import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
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
      <p className="flex items-start gap-2 text-sm text-muted">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={2.25} aria-hidden="true" />
        {es.citas.cancelarAyuda}
      </p>
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
          <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {es.citas.cancelarConfirmar}
        </Button>
      </div>
    </Dialog>
  );
}
