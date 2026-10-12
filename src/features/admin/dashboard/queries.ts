import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Database } from "@/lib/database.types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface DashboardAppointmentRow {
  /** "yyyy-MM-dd", ya calculado en Postgres en la hora local de cada clínica. */
  day: string;
  clinic_id: string;
  clinic_name: string;
  type_id: string;
  type_name: string;
  status: AppointmentStatus;
  n_appointments: number;
  n_confirmed: number;
}

export interface DashboardNewPatientRow {
  day: string;
  n_new_patients: number;
}

export function useDashboardAppointmentMetrics(fromIso: string, toIso: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["dashboard-appointment-metrics", fromIso, toIso],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_appointment_metrics", {
        p_from: fromIso,
        p_to: toIso,
      });
      if (error) throw error;
      return data as DashboardAppointmentRow[];
    },
  });
}

export function useDashboardNewPatients(fromIso: string, toIso: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["dashboard-new-patients", fromIso, toIso],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_new_patients", {
        p_from: fromIso,
        p_to: toIso,
      });
      if (error) throw error;
      return data as DashboardNewPatientRow[];
    },
  });
}
