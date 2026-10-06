import { useState } from "react";
import { useAdminClinics } from "./clinics/queries";

/**
 * Selección de clínica activa para pantallas de admin. Si solo hay una
 * clínica se usa automáticamente sin mostrar selector (D4); si hay
 * varias, el caller decide cómo renderizar las opciones usando `clinics`.
 * `selectedId` se deriva en el render (no en un efecto) para evitar un
 * set-state síncrono dentro de useEffect.
 */
export function useAdminClinicSelection() {
  const clinicsQuery = useAdminClinics();
  const [explicitId, setSelectedId] = useState<string | null>(null);

  const clinics = clinicsQuery.data ?? [];
  const selectedId = explicitId ?? clinics[0]?.id ?? null;
  const selectedClinic = clinics.find((c) => c.id === selectedId) ?? null;

  return { clinics, isLoading: clinicsQuery.isLoading, selectedId, setSelectedId, selectedClinic };
}
