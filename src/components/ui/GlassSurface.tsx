import type { ReactNode } from "react";

export interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

/**
 * Superficie glass acotada (regla dura #12): opacidad ≥ 0.85/0.90 bajo
 * texto, con fallback sólido automático vía `.glass` en
 * prefers-reduced-transparency / forced-colors / sin backdrop-filter.
 * Usar SOLO en nav inferior, header sticky, sheets/modales o tarjeta de
 * "próxima cita" — nunca en calendario ni listas con scroll, y máx. 2
 * capas por viewport.
 */
export function GlassSurface({ children, className = "", as: Tag = "div" }: GlassSurfaceProps) {
  return <Tag className={`glass ${className}`}>{children}</Tag>;
}
