import type { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

/**
 * Estado vacío consistente (ícono + título + descripción + 1 CTA
 * opcional) — reemplaza el patrón ad-hoc de "texto + botón" repetido
 * en cada pantalla. El ícono es decorativo (`aria-hidden`); el título
 * es el único mensaje obligatorio para quien usa lector de pantalla.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] border border-dashed border-line px-6 py-10 text-center">
      <span aria-hidden="true" className="text-muted">
        {icon}
      </span>
      <p className="font-medium text-ink">{title}</p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {action ? (
        <Button variant="primary" className="mt-2" onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
