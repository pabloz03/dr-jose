import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type Clinic = Tables<"clinics">;

export class ClinicHasAppointmentsError extends Error {}

export function useAdminClinics() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["admin-clinics"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Clinic[];
    },
  });
}

export function useSaveClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { id?: string } & Omit<TablesInsert<"clinics">, "id">) => {
      if (values.id) {
        const { id, ...update } = values;
        const { data, error } = await supabase
          .from("clinics")
          .update(update as TablesUpdate<"clinics">)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as Clinic;
      }
      const { data, error } = await supabase.from("clinics").insert(values).select().single();
      if (error) throw error;
      // Toda clínica nueva necesita su fila de reglas — sin esto
      // clinic_settings quedaría ausente y get_available_slots fallaría.
      const { error: settingsError } = await supabase.from("clinic_settings").insert({ clinic_id: data.id });
      if (settingsError) throw settingsError;
      return data as Clinic;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-clinics"] }),
  });
}

export function useDeleteClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinics").delete().eq("id", id);
      if (error) {
        // 23503: la FK de appointments.clinic_id es NO ACTION a propósito —
        // Postgres ya rechaza borrar una clínica con historial de citas,
        // sin necesidad de ninguna validación extra de nuestro lado.
        if (error.code === "23503") throw new ClinicHasAppointmentsError(error.message);
        throw new Error(error.message);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-clinics"] }),
  });
}
