import type { ReactNode } from "react";
import { PatientBottomNav } from "./PatientBottomNav";

/**
 * Envuelve las pantallas principales del paciente (Home, Citas, Perfil,
 * Ayuda) con el nav inferior persistente. NO se usa en el stepper de
 * reserva (un flujo guiado con su propio "Atrás" — un nav global ahí
 * compite con la navegación del paso a paso) ni en /ingresar ni en
 * /a/:token (pantallas públicas/sin sesión plena).
 */
export function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {children}
      <PatientBottomNav />
    </div>
  );
}
