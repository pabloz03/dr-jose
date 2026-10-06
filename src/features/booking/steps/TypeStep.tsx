import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { useAppointmentTypes } from "../queries";

export function TypeStep({ dir, onSelect }: { dir: 1 | -1; onSelect: (typeId: string) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const typesQuery = useAppointmentTypes();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        {es.reserva.tipoTitulo}
      </h2>

      {typesQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {(typesQuery.data ?? []).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className="flex min-h-tap w-full items-center justify-between rounded-md border border-line bg-surface px-4 py-3 text-left text-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-muted">{es.reserva.tipoDuracion(t.duration_min)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
