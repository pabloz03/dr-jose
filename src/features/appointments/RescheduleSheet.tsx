import { useState } from "react";
import { es } from "@/i18n/es";
import { Sheet } from "@/components/ui/Sheet";
import { DateTimeStep } from "@/features/booking/steps/DateTimeStep";
import type { SlotRow } from "@/features/booking/queries";

export function RescheduleSheet({
  isOpen,
  onOpenChange,
  clinicId,
  doctorId,
  typeId,
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  doctorId: string;
  typeId: string;
  onSelect: (slot: SlotRow) => void;
}) {
  // Fuerza remount del calendario cada vez que se abre, para no arrastrar
  // la fecha seleccionada de un intento anterior.
  const [openCount, setOpenCount] = useState(0);

  return (
    <Sheet
      title={es.citas.reprogramarTitulo}
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (open) setOpenCount((c) => c + 1);
        onOpenChange(open);
      }}
    >
      <DateTimeStep
        key={openCount}
        dir={1}
        clinicId={clinicId}
        doctorId={doctorId}
        typeId={typeId}
        confirmLabel={es.citas.reprogramarGuardarBoton}
        onSelect={onSelect}
      />
    </Sheet>
  );
}
