import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import type { Tables } from "@/lib/database.types";

/**
 * Solo se monta cuando hay más de una clínica activa (el padre ya
 * resolvió la autoselección cuando hay una sola) — las clínicas ya
 * vienen cargadas del padre, sin fetch propio.
 */
export function ClinicStep({
  dir,
  clinics,
  onSelect,
}: {
  dir: 1 | -1;
  clinics: Tables<"clinics">[];
  onSelect: (clinicId: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
        {es.reserva.clinicaTitulo}
      </h2>

      <ul className="mt-6 flex flex-col gap-2.5">
        {clinics.map((c) => (
          <li key={c.id}>
            <Card onPress={() => onSelect(c.id)} className="flex items-center gap-3">
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
    </motion.div>
  );
}
