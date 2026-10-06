import { es } from "@/i18n/es";

export function StepProgress({ current }: { current: number }) {
  const total = es.reserva.pasos.length;
  return (
    <nav aria-label={es.reserva.titulo}>
      <p className="text-sm font-medium text-muted">{es.reserva.pasoProgreso(current + 1, total)}</p>
      <ol className="mt-2 flex gap-2">
        {es.reserva.pasos.map((label, i) => (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-accent" : "bg-line"}`}
          >
            <span className="sr-only">
              {label}
              {i < current ? ` (${es.reserva.pasoCompletado})` : i === current ? ` (${es.reserva.pasoActual})` : ""}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
