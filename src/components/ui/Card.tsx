import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Hace la tarjeta un botón accesible completo (toda el área es interactiva). */
  onPress?: () => void;
}

const base = "rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow-1)]";

/**
 * Superficie elevada SIN glass — para listas con scroll (citas,
 * pacientes, filas de admin), donde `GlassSurface` está prohibido
 * (regla dura #12: "nunca en calendario ni listas con scroll"). Logra
 * sensación "premium" con sombra/borde en vez de transparencia.
 */
export function Card({ children, className = "", onPress }: CardProps) {
  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`${base} w-full text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
