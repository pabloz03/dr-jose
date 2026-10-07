import { es } from "@/i18n/es";

export function StepProgress({
  current,
  steps = es.reserva.pasos,
  label = es.reserva.titulo,
}: {
  current: number;
  /** Permite reusar el mismo indicador visual en otros flujos (ej. reserva de invitado) sin duplicar el componente. */
  steps?: readonly string[];
  label?: string;
}) {
  const total = steps.length;
  return (
    <nav aria-label={label}>
      <p className="text-sm font-medium text-muted">{es.reserva.pasoProgreso(current + 1, total)}</p>
      <ol className="mt-2 flex gap-2">
        {steps.map((step, i) => (
          <li
            key={step}
            aria-current={i === current ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-accent" : "bg-line"}`}
          >
            <span className="sr-only">
              {step}
              {i < current ? ` (${es.reserva.pasoCompletado})` : i === current ? ` (${es.reserva.pasoActual})` : ""}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
