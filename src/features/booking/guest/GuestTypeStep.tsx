import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { GuestType } from "./queries";

/**
 * Visualmente idéntico a TypeStep (src/features/booking/steps/TypeStep.tsx)
 * pero recibe los tipos por prop en vez de usar useAppointmentTypes —
 * esa tabla solo tiene política RLS "to authenticated" (0002_rls.sql),
 * un invitado anon no puede leerla directo. Los datos ya vienen
 * resueltos por la Edge Function guest-booking (modo "options").
 */
export function GuestTypeStep({
  dir,
  types,
  isLoading,
  onSelect,
}: {
  dir: 1 | -1;
  types: GuestType[];
  isLoading: boolean;
  onSelect: (typeId: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reserva.tipoTitulo}
      </h2>

      {isLoading ? (
        <div className="mt-4">
          <SkeletonList count={3} />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {types.map((t) => (
            <li key={t.id}>
              <Card onPress={() => onSelect(t.id)} className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-on-accent-2">
                    <Stethoscope className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <span className="font-medium text-ink">{t.name}</span>
                </span>
                <span className="text-sm text-muted">{es.reserva.tipoDuracion(t.duration_min)}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
