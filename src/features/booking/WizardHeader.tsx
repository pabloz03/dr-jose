import { ArrowLeft, X } from "lucide-react";

/**
 * Header fijo del wizard de reserva (lenguaje "Savia"): botón atrás
 * circular + título estático centrado + botón cerrar. Sustituye el
 * `<h1>` + link "Atrás" del pie que usaba la fase 1 del rediseño — el
 * título dinámico de cada paso (ej. "¿Para quién es la cita?") sigue
 * viviendo en el `<h2 ref={headingRef}>` de cada Step, que recibe el
 * foco al montar (a11y, sin cambios).
 */
export function WizardHeader({
  title,
  onBack,
  onClose,
  backLabel,
  closeLabel,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
  backLabel: string;
  closeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-line bg-surface text-ink transition-colors duration-150 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </button>
      <p className="font-display text-base text-ink">{title}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-[var(--r-pill)] text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <X className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </div>
  );
}
