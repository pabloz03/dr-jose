import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type Clinic = Tables<"clinics">;

export function useAdminClinics() {
  return useQuery({
    queryKey: ["admin-clinics"],
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
