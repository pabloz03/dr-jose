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
    <nav aria-label={label} className="flex items-center gap-3">
      <ol className="flex flex-1 gap-2">
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
      <span className="shrink-0 text-xs text-muted">{es.reserva.pasoProgreso(current + 1, total)}</span>
    </nav>
  );
}
