import type { ReactNode } from "react";

export interface EyebrowProps {
  children: ReactNode;
  /** Para usarse dentro del bloque hero (fondo oscuro fijo, ver tokens.css --hero-*). */
  onDark?: boolean;
  className?: string;
}

/**
 * Micro-etiqueta en mayúsculas que antecede a un título de sección —
 * recurso editorial (Nike/revistas) para dar jerarquía sin agrandar
 * el encabezado. Siempre texto, nunca el único indicador de nada
 * (regla dura #10 no aplica aquí: es puramente tipográfico).
 */
export function Eyebrow({ children, onDark = false, className = "" }: EyebrowProps) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-wide ${onDark ? "text-[var(--hero-accent)]" : "text-accent"} ${className}`}
    >
      {children}
    </p>
  );
}
