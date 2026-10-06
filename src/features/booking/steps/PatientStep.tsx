import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { usePatients } from "@/features/family/queries";

export function PatientStep({ dir, onSelect }: { dir: 1 | -1; onSelect: (patientId: string) => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const patientsQuery = usePatients();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const patients = patientsQuery.data ?? [];

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        {es.reserva.pacienteTitulo}
      </h2>

      {patientsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : patients.length === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-muted">{es.reserva.pacienteVacio}</p>
          <Button variant="primary" onPress={() => navigate("/perfil")}>
            {es.reserva.irAPerfil}
          </Button>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {patients.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className="min-h-tap w-full rounded-md border border-line bg-surface px-4 py-3 text-left text-ink data-[hovered]:bg-line hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="font-medium">{p.full_name}</span>
                {p.is_self ? <span className="ml-2 text-sm text-muted">({es.familia.esUsted})</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
