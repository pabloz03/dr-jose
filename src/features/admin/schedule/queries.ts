import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatClinicDateTime } from "@/lib/tz";
import type { Tables, TablesInsert } from "@/lib/database.types";

type ClinicHour = Tables<"clinic_hours">;
type ScheduleException = Tables<"schedule_exceptions">;

export class OverlapError extends Error {}

function rethrow(error: { code?: string; message: string }): never {
  if (error.code === "23P01") throw new OverlapError(error.message);
  throw new Error(error.message);
}

export function useClinicHours(clinicId: string | undefined, doctorId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-hours", clinicId, doctorId],
    enabled: !!clinicId && !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_hours")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("doctor_id", doctorId!)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as ClinicHour[];
    },
  });
}

export function useAddClinicHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"clinic_hours">) => {
      const { data, error } = await supabase.from("clinic_hours").insert(values).select().single();
      if (error) rethrow(error);
      return data as ClinicHour;
    },
    onSuccess: (_d, vars) =>
      queryClient.invalidateQueries({ queryKey: ["clinic-hours", vars.clinic_id, vars.doctor_id] }),
  });
}

export function useRemoveClinicHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinic_hours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clinic-hours"] }),
  });
}

export function useScheduleExceptions(clinicId: string | undefined, doctorId: string | undefined) {
  return useQuery({
    queryKey: ["schedule-exceptions", clinicId, doctorId],
    enabled: !!clinicId && !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_exceptions")
        .select("*")
        .eq("clinic_id", clinicId!)
        .eq("doctor_id", doctorId!)
        .gte("on_date", formatClinicDateTime(new Date().toISOString(), "yyyy-MM-dd"))
        .order("on_date", { ascending: true });
      if (error) throw error;
      return data as ScheduleException[];
    },
  });
}

export function useAddScheduleException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<"schedule_exceptions">) => {
      const { data, error } = await supabase.from("schedule_exceptions").insert(values).select().single();
      if (error) throw error;
      return data as ScheduleException;
    },
    onSuccess: (_d, vars) =>
      queryClient.invalidateQueries({ queryKey: ["schedule-exceptions", vars.clinic_id, vars.doctor_id] }),
  });
}

export function useRemoveScheduleException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_exceptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-exceptions"] }),
  });
}
