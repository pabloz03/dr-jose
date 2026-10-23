import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { StepFooter } from "@/features/booking/StepFooter";
import type { GuestClinic } from "./queries";

/**
 * Visualmente idéntico a ClinicStep (src/features/booking/steps/ClinicStep.tsx)
 * pero recibe las clínicas por prop — el edge function guest-booking
 * (modo "options") ya las resolvió con service role, un invitado anon
 * no puede leer la tabla clinics directo.
 */
export function GuestClinicStep({
  dir,
  clinics,
  onSelect,
}: {
  dir: 1 | -1;
  clinics: GuestClinic[];
  onSelect: (clinicId: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const selectedClinic = clinics.find((c) => c.id === selectedId) ?? null;

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" className="flex flex-1 flex-col">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reservaInvitado.clinicaTitulo}
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {clinics.map((c) => (
          <li key={c.id}>
            <Card selected={selectedId === c.id} onPress={() => setSelectedId(c.id)} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-on-accent-2">
                <Stethoscope className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-ink">{c.name}</span>
                {c.address ? <span className="block text-sm text-muted">{c.address}</span> : null}
              </span>
            </Card>
          </li>
        ))}
      </ul>

      <StepFooter
        label={es.reservaInvitado.clinicaBoton}
        caption={selectedClinic?.name}
        isDisabled={!selectedId}
        onPress={() => selectedId && onSelect(selectedId)}
      />
    </motion.div>
  );
}
