import type { ReactNode } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  className?: string;
}

/**
 * Generaliza el patrón `role="group"` + botones `aria-pressed` que ya
 * existía inline en CalendarPage.tsx (selector día/semana/mes) — se
 * reusa también en el toggle semana/mes y las 4 pestañas de sección
 * de Métricas. Pista gris + pastilla de fondo en la opción activa
 * (lenguaje "Savia" del Figma admin), sin motion/react: el cambio de
 * fondo es instantáneo, no una pastilla animada con layoutId (ese
 * patrón queda para el nav inferior, que tiene menos opciones y más
 * espacio para justificar la animación).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={props["aria-label"]} className={`flex gap-1 rounded-[var(--r-pill)] bg-line p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-[var(--r-pill)] px-3 text-sm font-medium transition-colors duration-150 ${
            value === opt.value ? "bg-surface text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
