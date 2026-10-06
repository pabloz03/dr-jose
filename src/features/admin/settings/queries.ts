import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type ClinicSettings = Tables<"clinic_settings">;
type AppointmentType = Tables<"appointment_types">;

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { clinic_id: string } & Omit<TablesUpdate<"clinic_settings">, "clinic_id">) => {
      const { clinic_id, ...update } = values;
      const { data, error } = await supabase
        .from("clinic_settings")
        .update(update)
        .eq("clinic_id", clinic_id)
        .select()
        .single();
      if (error) throw error;
      return data as ClinicSettings;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings", vars.clinic_id] });
    },
  });
}

export function useAdminAppointmentTypes() {
  return useQuery({
    queryKey: ["admin-appointment-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointment_types").select("*").order("sort", { ascending: true });
      if (error) throw error;
      return data as AppointmentType[];
    },
  });
}

export function useSaveAppointmentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { id?: string } & Omit<TablesInsert<"appointment_types">, "id">) => {
      if (values.id) {
        const { id, ...update } = values;
        const { data, error } = await supabase
          .from("appointment_types")
          .update(update as TablesUpdate<"appointment_types">)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data as AppointmentType;
      }
      const { data, error } = await supabase.from("appointment_types").insert(values).select().single();
      if (error) throw error;
      return data as AppointmentType;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointment-types"] }),
  });
}
