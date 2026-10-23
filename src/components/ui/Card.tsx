import type { ReactNode } from "react";
import { Check } from "lucide-react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Hace la tarjeta un botón accesible completo (toda el área es interactiva). */
  onPress?: () => void;
  /**
   * Si se define (true/false), la tarjeta se comporta como un ítem de
   * una lista de selección "elegir → Continuar" (clínica, tipo de
   * cita, paciente): agrega `aria-pressed`, tinte de acento y un
   * indicador circular a la derecha (check relleno si está elegida,
   * círculo vacío si no). `undefined` = tarjeta normal, sin indicador.
   */
  selected?: boolean;
}

const base = "rounded-lg border border-line bg-surface p-4";

/**
 * Superficie elevada SIN glass — para listas con scroll (citas,
 * pacientes, filas de admin), donde `GlassSurface` está prohibido
 * (regla dura #12: "nunca en calendario ni listas con scroll"). Diseño
 * plano (sin --shadow-1/2): borde 1px + contraste de fondo da toda la
 * separación visual que necesita, consistente con el rediseño "Savia".
 */
export function Card({ children, className = "", onPress, selected }: CardProps) {
  const isSelectable = selected !== undefined;
  const selectedTone = selected ? "border-accent bg-accent-2" : "";
  const indicator = isSelectable ? (
    <span
      aria-hidden="true"
      className={`absolute right-4 top-1/2 flex h-5 w-5 shrink-0 -translate-y-1/2 items-center justify-center rounded-[var(--r-pill)] border-2 transition-colors duration-150 ${
        selected ? "border-accent bg-accent text-on-accent" : "border-border-ui bg-transparent"
      }`}
    >
      {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
    </span>
  ) : null;

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-pressed={isSelectable ? selected : undefined}
        className={`${base} relative w-full text-left transition-[transform,border-color,background-color] duration-150 hover:-translate-y-0.5 hover:border-accent active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${selectedTone} ${isSelectable ? "pr-10" : ""} ${className}`}
      >
        {children}
        {indicator}
      </button>
    );
  }
  return (
    <div className={`${base} relative ${selectedTone} ${className}`}>
      {children}
      {indicator}
    </div>
  );
}
