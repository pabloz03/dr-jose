import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/database.types";

export interface PatientAppointmentRow {
  id: string;
  starts_at: string;
  status: Tables<"appointments">["status"];
  type: { id: string; name: string };
  clinic: { id: string; name: string };
}

export function usePatient(id: string | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["admin-patient", id],
    enabled: !!session && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Tables<"patients">;
    },
  });
}

export function usePatientAppointments(id: string | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["admin-patient-appointments", id],
    enabled: !!session && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id,starts_at,status,type:type_id(id,name),clinic:clinic_id(id,name)")
        .eq("patient_id", id!)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PatientAppointmentRow[];
    },
  });
}
