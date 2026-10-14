import { createContext, useContext, useState, type ReactNode } from "react";
import { useAdminClinics } from "./clinics/queries";
import type { Tables } from "@/lib/database.types";

type Clinic = Tables<"clinics">;

interface AdminClinicState {
  clinics: Clinic[];
  isLoading: boolean;
  selectedId: "all" | string;
  setSelectedId: (id: "all" | string) => void;
  selectedClinic: Clinic | null;
}

const AdminClinicContext = createContext<AdminClinicState | null>(null);

/**
 * Selección de clínica activa para TODO el panel de admin — montado en
 * providers.tsx (no en AdminLayout) a propósito: cada ruta /admin/*
 * monta su propio AdminLayout desde cero al navegar (router.tsx es un
 * createBrowserRouter plano, sin layout route con Outlet), así que un
 * estado que viviera ahí se resetearía en cada cambio de pantalla —
 * justo lo contrario de lo que pide esta pantalla compartida.
 *
 * "all" es un estado válido en sí mismo (ver useAdminClinic) para las
 * pantallas que sí pueden mostrar/filtrar "todas las clínicas" (Hoy,
 * Calendario, Métricas, Pacientes). Para las que necesitan exactamente
 * una clínica concreta (Horarios, Ajustes, reserva manual — no existe
 * "horario para todas las clínicas" como una sola fila), usar
 * useResolvedAdminClinic en vez de este hook directo.
 */
export function AdminClinicProvider({ children }: { children: ReactNode }) {
  const clinicsQuery = useAdminClinics();
  const [selectedId, setSelectedId] = useState<"all" | string>("all");

  const clinics = clinicsQuery.data ?? [];
  const selectedClinic = selectedId === "all" ? null : (clinics.find((c) => c.id === selectedId) ?? null);

  return (
    <AdminClinicContext.Provider
      value={{ clinics, isLoading: clinicsQuery.isLoading, selectedId, setSelectedId, selectedClinic }}
    >
      {children}
    </AdminClinicContext.Provider>
  );
}

function useAdminClinicContext(): AdminClinicState {
  const ctx = useContext(AdminClinicContext);
  if (!ctx) throw new Error("useAdminClinic debe usarse dentro de AdminClinicProvider");
  return ctx;
}

/** Para Hoy, Calendario, Métricas, Pacientes — "all" es una vista válida. */
export function useAdminClinic() {
  return useAdminClinicContext();
}

/**
 * Para Horarios, Ajustes, reserva manual — necesitan exactamente una
 * clínica concreta. Si el estado compartido está en "all" (nadie eligió
 * una clínica todavía), resuelve a la primera sin tocar el estado
 * compartido — derivado puramente en el render, igual que ya hacía
 * useAdminClinicSelection, así que no hay riesgo de loop ni de
 * selección obsoleta. Si el usuario elige una clínica concreta desde
 * aquí, sí escribe al estado compartido (setSelectedId), para que Hoy/
 * Calendario/Métricas también la reflejen.
 */
export function useResolvedAdminClinic() {
  const { clinics, isLoading, selectedId, setSelectedId } = useAdminClinicContext();
  const resolvedId = selectedId === "all" ? (clinics[0]?.id ?? null) : selectedId;
  const selectedClinic = clinics.find((c) => c.id === resolvedId) ?? null;
  return { clinics, isLoading, selectedId: resolvedId, setSelectedId, selectedClinic };
}
