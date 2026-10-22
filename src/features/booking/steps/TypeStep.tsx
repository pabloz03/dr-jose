import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAppointmentTypes } from "../queries";

export function TypeStep({ dir, onSelect }: { dir: 1 | -1; onSelect: (typeId: string) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const typesQuery = useAppointmentTypes();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
        {es.reserva.tipoTitulo}
      </h2>

      {typesQuery.isLoading ? (
        <div className="mt-6">
          <SkeletonList count={3} />
        </div>
      ) : typesQuery.isError ? (
        <div className="mt-6">
          <ErrorState onRetry={() => typesQuery.refetch()} />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {(typesQuery.data ?? []).map((t) => (
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
