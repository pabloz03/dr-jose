import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { es } from "@/i18n/es";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        {es.common.cargando}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingresar" replace />;
  }

  return <>{children}</>;
}
