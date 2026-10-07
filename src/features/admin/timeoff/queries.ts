import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/lib/database.types";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

type TimeOff = Tables<"time_off">;

export function useTimeOffList(doctorId: string | undefined) {
  return useQuery({
    queryKey: ["time-off", doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off")
        .select("*")
        .eq("doctor_id", doctorId!)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as TimeOff[];
    },
  });
}

export function useAffectedAppointments() {
  return useMutation({
    mutationFn: async (params: { doctorId: string; clinicId: string | null; from: string; to: string }) => {
      // El tipo generado marca p_clinic como `string`, pero la función SQL
      // acepta null explícitamente (= todas las clínicas) — el generador
      // no detecta esa nulabilidad desde la firma `uuid` sin `not null`.
      const { data, error } = await supabase.rpc("appointments_affected_by", {
        p_doctor: params.doctorId,
        p_clinic: params.clinicId as string,
        p_from: params.from,
        p_to: params.to,
      });
      if (error) throw error;
      const ids = (data ?? []).map((a) => a.id);
      if (ids.length === 0) return [] as AppointmentWithDetails[];
      const { data: full, error: fullError } = await supabase
        .from("appointments")
        .select("*, patient:patient_id(id,full_name,is_self), type:type_id(id,name,duration_min), clinic:clinic_id(id,name,address,maps_url,phone,whatsapp,timezone)")
        .in("id", ids);
      if (fullError) throw fullError;
      return full as unknown as AppointmentWithDetails[];
    },
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"time_off">) => {
      const { data, error } = await supabase.from("time_off").insert(values).select().single();
      if (error) throw error;
      return data as TimeOff;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-off"] }),
  });
}

export function useRemoveTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_off").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-off"] }),
  });
}
