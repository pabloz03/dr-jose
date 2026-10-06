export interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

/**
 * Anuncia mensajes de estado (confirmación, error, resultado de acción) a
 * tecnología asistiva sin moverse visualmente — regla dura #14 y criterio
 * WCAG 4.1.3. Usar "assertive" solo para errores que requieren atención
 * inmediata; "polite" (default) para confirmaciones.
 */
export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  return (
    <div role="status" aria-live={assertive ? "assertive" : "polite"} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
