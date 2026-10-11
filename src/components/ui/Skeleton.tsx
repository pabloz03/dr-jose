export interface SkeletonProps {
  className?: string;
  /** Texto accesible para quien usa lector de pantalla — el skeleton real es `aria-hidden`, este es el único anuncio. */
  label?: string;
}

/**
 * Reemplaza el "Cargando…" de texto plano. Usa la clase `.skeleton`
 * (gradiente estático, ver base.css) — sin animación a propósito: la
 * regla dura #11 prohíbe animaciones infinitas y un shimmer de carga
 * es infinito por naturaleza. `role="status"` + `label` oculto dan el
 * mismo anuncio que el texto que reemplaza.
 */
export function Skeleton({ className = "h-4 w-full", label = "Cargando…" }: SkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={`skeleton ${className}`} />
    </div>
  );
}

/** Fila tipo tarjeta (cita/paciente en una lista) — línea de título + línea secundaria. */
export function SkeletonCard() {
  return (
    <div role="status" className="rounded-[var(--r-lg)] border border-line bg-surface p-4">
      <span className="sr-only">Cargando…</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}

/** Lista de N filas skeleton — para listas de citas/pacientes mientras cargan. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
