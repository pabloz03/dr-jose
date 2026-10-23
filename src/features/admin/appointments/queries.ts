import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { notifyAppointment } from "@/lib/email";
import type { Tables } from "@/lib/database.types";
import { SlotUnavailableError, type AppointmentWithDetails } from "@/features/appointments/queries";

const APPOINTMENT_SELECT =
  "*, patient:patient_id(id,full_name,is_self), type:type_id(id,name,duration_min), clinic:clinic_id(id,name,address,maps_url,phone,whatsapp,timezone)";

export function useAdminAppointmentsRange(
  doctorId: string | undefined,
  fromIso: string,
  toIso: string,
  clinicId?: "all" | string,
) {
  return useQuery({
    queryKey: ["admin-appointments", doctorId, fromIso, toIso, clinicId],
    enabled: !!doctorId,
    queryFn: async () => {
      let request = supabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .eq("doctor_id", doctorId!)
        .gte("starts_at", fromIso)
        .lt("starts_at", toIso);
      if (clinicId && clinicId !== "all") request = request.eq("clinic_id", clinicId);
      const { data, error } = await request.order("starts_at", { ascending: true });
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

export function usePatientSearch(query: string, clinicId?: "all" | string) {
  const { session } = useAuth();
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["admin-patient-search", trimmed, clinicId],
    enabled: !!session,
    queryFn: async () => {
      // Un paciente no pertenece a una sola clínica (registro global de
      // la práctica — puede tener citas en varias), así que filtrar por
      // clínica significa "tiene al menos una cita ahí", vía un inner
      // join a appointments. !inner solo cambia el tipo de join (excluye
      // pacientes sin ninguna cita en esa clínica); no aplana/duplica
      // las filas de patients aunque tengan varias citas ahí.
      let request = clinicId && clinicId !== "all"
        ? supabase.from("patients").select("*, appointments!inner(clinic_id)").eq("appointments.clinic_id", clinicId)
        : supabase.from("patients").select("*");
      request = request.is("deleted_at", null);
      if (trimmed) request = request.ilike("full_name", `%${trimmed}%`);
      const { data, error } = await request.order("full_name", { ascending: true }).limit(200);
      if (error) throw error;
      return data as unknown as Tables<"patients">[];
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
      if (error) {
        if (error.message.includes("slot_unavailable")) throw new SlotUnavailableError(error.message);
        throw error;
      }
      return data as Tables<"appointments">;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      notifyAppointment("booked", data.id);
    },
  });
}
