import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { User } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
        {es.reserva.pacienteTitulo}
      </h2>

      {patientsQuery.isLoading ? (
        <p className="mt-6 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : patients.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-muted">{es.reserva.pacienteVacio}</p>
          <Button variant="primary" onPress={() => navigate("/perfil")}>
            {es.reserva.irAPerfil}
          </Button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {patients.map((p) => (
            <li key={p.id}>
              <Card onPress={() => onSelect(p.id)} className="flex items-center gap-3">
                <User className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
                <span>
                  <span className="font-medium text-ink">{p.full_name}</span>
                  {p.is_self ? <span className="ml-2 text-sm text-muted">({es.familia.esUsted})</span> : null}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
