import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Hace la tarjeta un botón accesible completo (toda el área es interactiva). */
  onPress?: () => void;
}

const base = "rounded-lg border border-line bg-surface p-4";

/**
 * Superficie elevada SIN glass — para listas con scroll (citas,
 * pacientes, filas de admin), donde `GlassSurface` está prohibido
 * (regla dura #12: "nunca en calendario ni listas con scroll"). Diseño
 * plano (sin --shadow-1/2): borde 1px + contraste de fondo da toda la
 * separación visual que necesita, consistente con el rediseño "Savia".
 */
export function Card({ children, className = "", onPress }: CardProps) {
  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`${base} w-full text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-accent active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
