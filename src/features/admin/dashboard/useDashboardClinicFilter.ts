import { useState } from "react";
import { useAdminClinics } from "../clinics/queries";

/**
 * Filtro de clínica propio del Dashboard: a diferencia de
 * `useAdminClinicSelection` (que siempre colapsa a una clínica real),
 * acá "todas las clínicas" es la vista por defecto que pidió el
 * doctor, así que el estado es tri-valor (`"all" | clinicId`). Reusa
 * la misma query (`useAdminClinics`) que ya envuelve ese hook, sin
 * pedir los datos dos veces.
 */
export function useDashboardClinicFilter() {
  const clinicsQuery = useAdminClinics();
  const [filter, setFilter] = useState<"all" | string>("all");

  const clinics = clinicsQuery.data ?? [];

  return { clinics, isLoading: clinicsQuery.isLoading, filter, setFilter };
}
