import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { es } from "@/i18n/es";
import { useMyStaff } from "./useMyStaff";

/** Asume que ya corrió dentro de RequireAuth (hay sesión). */
export function RequireDoctor({ children }: { children: ReactNode }) {
  const staffQuery = useMyStaff();

  if (staffQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        {es.common.cargando}
      </div>
    );
  }

  if (staffQuery.data?.role !== "doctor") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
