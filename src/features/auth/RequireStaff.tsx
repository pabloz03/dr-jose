import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { es } from "@/i18n/es";
import { useMyStaff } from "./useMyStaff";

/**
 * Operación (Hoy, calendario, pacientes, citas) — doctor Y asistente.
 * Para configuración (clínicas/ajustes/horarios/bloqueos) usar
 * RequireDoctor en su lugar: el asistente opera la agenda, no la define.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const staffQuery = useMyStaff();

  if (staffQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        {es.common.cargando}
      </div>
    );
  }

  if (!staffQuery.data) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
