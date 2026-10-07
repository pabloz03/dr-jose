import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/lib/database.types";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

const APPOINTMENT_SELECT =
  "*, patient:patient_id(id,full_name,is_self), type:type_id(id,name,duration_min), clinic:clinic_id(id,name,address,maps_url,phone,whatsapp,timezone)";

export function useAdminAppointmentsRange(doctorId: string | undefined, fromIso: string, toIso: string) {
  return useQuery({
    queryKey: ["admin-appointments", doctorId, fromIso, toIso],
    enabled: !!doctorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .eq("doctor_id", doctorId!)
        .gte("starts_at", fromIso)
        .lt("starts_at", toIso)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as AppointmentWithDetails[];
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: "completed" | "no_show" }) => {
      const { data, error } = await supabase.rpc("mark_appointment_attendance", {
        p_id: params.id,
        p_status: params.status,
      });
      if (error) throw new Error(error.message);
      return data as Tables<"appointments">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function usePatientSearch(query: string) {
  return useQuery({
    queryKey: ["admin-patient-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .ilike("full_name", `%${query.trim()}%`)
        .order("full_name", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as Tables<"patients">[];
    },
  });
}

export function useCreateGuestPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { full_name: string; contact_email?: string }) => {
      const { data, error } = await supabase
        .from("patients")
        .insert({ full_name: values.full_name, contact_email: values.contact_email || null, guardian_user_id: null })
        .select()
        .single();
      if (error) throw error;
      return data as Tables<"patients">;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-patient-search"] }),
  });
}

export function useBookAppointmentStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { patientId: string; typeId: string; clinicId: string; doctorId: string; start: string }) => {
      const { data, error } = await supabase.rpc("book_appointment_staff", {
        p_patient: params.patientId,
        p_type: params.typeId,
        p_clinic: params.clinicId,
        p_doctor: params.doctorId,
        p_start: params.start,
      });
      if (error) throw new Error(error.message);
      return data as Tables<"appointments">;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });
}
