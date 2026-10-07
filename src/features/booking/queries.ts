import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";

type Clinic = Tables<"clinics">;
type AppointmentType = Tables<"appointment_types">;
type Staff = Tables<"staff">;
type ClinicSettings = Tables<"clinic_settings">;

/** MVP: una sola clínica activa (D4 — UI oculta el selector si hay una). */
export function useClinic() {
  return useQuery({
    queryKey: ["clinic"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").eq("is_active", true).limit(1).maybeSingle();
      if (error) throw error;
      return data as Clinic | null;
    },
  });
}

export function useDoctor(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["doctor", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_staff")
        .select("staff:staff_id(id, full_name, role)")
        .eq("clinic_id", clinicId!);
      if (error) throw error;
      const doctor = (data ?? [])
        .map((row) => row.staff as unknown as Staff)
        .find((s) => s?.role === "doctor");
      return doctor ?? null;
    },
  });
}

export function useClinicSettings(clinicId: string | undefined) {
  return useQuery({
    queryKey: ["clinic-settings", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("*").eq("clinic_id", clinicId!).single();
      if (error) throw error;
      return data as ClinicSettings;
    },
  });
}

export function useAppointmentTypes() {
  return useQuery({
    queryKey: ["appointment-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_types")
        .select("*")
        .eq("is_active", true)
        .eq("bookable_online", true)
        .order("sort", { ascending: true });
      if (error) throw error;
      return data as AppointmentType[];
    },
  });
}

export interface SlotRow {
  slot_start: string;
  slot_end: string;
}

export function useAvailableSlots(params: {
  clinicId: string | undefined;
  doctorId: string | undefined;
  typeId: string | undefined;
  from: string;
  to: string;
  /** Staff saltándose min_lead_hours para citas manuales (E6-S4). */
  ignoreLeadTime?: boolean;
}) {
  const { clinicId, doctorId, typeId, from, to, ignoreLeadTime } = params;
  return useQuery({
    queryKey: ["available-slots", clinicId, doctorId, typeId, from, to, ignoreLeadTime],
    enabled: !!clinicId && !!doctorId && !!typeId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_clinic: clinicId!,
        p_doctor: doctorId!,
        p_type: typeId!,
        p_from: from,
        p_to: to,
        p_ignore_lead_time: ignoreLeadTime,
      });
      if (error) throw error;
      return data as SlotRow[];
    },
  });
}

export class SlotUnavailableError extends Error {}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { patientId: string; typeId: string; clinicId: string; doctorId: string; start: string }) => {
      const { data, error } = await supabase.rpc("book_appointment", {
        p_patient: params.patientId,
        p_type: params.typeId,
        p_clinic: params.clinicId,
        p_doctor: params.doctorId,
        p_start: params.start,
      });
      if (error) {
        if (error.message.includes("slot_unavailable")) throw new SlotUnavailableError(error.message);
        throw error;
      }
      return data as Tables<"appointments">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
