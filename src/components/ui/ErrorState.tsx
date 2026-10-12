import { AlertTriangle } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/**
 * Para cuando una query o mutación FALLÓ — distinto de EmptyState
 * (que es un resultado legítimo de cero elementos). `role="alert"`
 * (no "status" como EmptyState) porque es un fallo real que merece
 * anuncio inmediato a lectores de pantalla, mismo criterio que ya
 * usaba PatientList.tsx antes de esta primitiva.
 */
export function ErrorState({ title = es.common.errorCargaGenerico, description, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-[var(--r-lg)] border border-danger/30 bg-surface px-6 py-10 text-center">
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-danger" strokeWidth={1.75} />
      <p className="font-medium text-ink">{title}</p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" className="mt-2" onPress={onRetry}>
          {es.common.reintentar}
        </Button>
      ) : null}
    </div>
  );
}
