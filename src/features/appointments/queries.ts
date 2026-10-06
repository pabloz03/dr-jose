import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/database.types";

export interface AppointmentWithDetails extends Tables<"appointments"> {
  patient: Pick<Tables<"patients">, "id" | "full_name" | "is_self">;
  type: Pick<Tables<"appointment_types">, "id" | "name" | "duration_min">;
  clinic: Pick<Tables<"clinics">, "id" | "name" | "address" | "maps_url" | "phone" | "whatsapp" | "timezone">;
}

const APPOINTMENT_SELECT =
  "*, patient:patient_id(id,full_name,is_self), type:type_id(id,name,duration_min), clinic:clinic_id(id,name,address,maps_url,phone,whatsapp,timezone)";

export function useAppointments() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["appointments", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as AppointmentWithDetails[];
    },
  });
}

export function useAppointment(id: string | undefined) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["appointment", id],
    enabled: !!session && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select(APPOINTMENT_SELECT).eq("id", id!).single();
      if (error) throw error;
      return data as unknown as AppointmentWithDetails;
    },
  });
}

export class TooLateError extends Error {}
export class SlotUnavailableError extends Error {}

function rethrowKnown(error: { message: string }): never {
  if (error.message.includes("too_late")) throw new TooLateError(error.message);
  if (error.message.includes("slot_unavailable")) throw new SlotUnavailableError(error.message);
  throw new Error(error.message);
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("confirm_appointment", { p_id: id });
      if (error) rethrowKnown(error);
      return data as Tables<"appointments">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("cancel_appointment", {
        p_id: params.id,
        p_reason: params.reason,
      });
      if (error) rethrowKnown(error);
      return data as Tables<"appointments">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; newStart: string }) => {
      const { data, error } = await supabase.rpc("reschedule_appointment", {
        p_id: params.id,
        p_new_start: params.newStart,
      });
      if (error) rethrowKnown(error);
      return data as Tables<"appointments">;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}
