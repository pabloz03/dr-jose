import type { ReactNode } from "react";

export interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}

/**
 * Superficie glass acotada (regla dura #12): opacidad ≥ 0.85/0.90 bajo
 * texto, con fallback sólido automático vía `.glass` en
 * prefers-reduced-transparency / forced-colors / sin backdrop-filter.
 * Usar SOLO en nav inferior/lateral, header sticky o sheets/modales —
 * nunca en calendario ni listas con scroll, y máx. 2 capas por
 * viewport. La tarjeta de "próxima cita" de Home ya no es glass: usa
 * el bloque --hero-* sólido (ver tokens.css), el otro punto focal
 * permitido fuera de esta lista.
 */
export function GlassSurface({ children, className = "", as: Tag = "div" }: GlassSurfaceProps) {
  return <Tag className={`glass ${className}`}>{children}</Tag>;
}
