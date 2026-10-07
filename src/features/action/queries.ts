import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SlotRow } from "@/features/booking/queries";

export type TokenPurpose = "confirm" | "cancel" | "reschedule";

export interface TokenAppointment {
  id: string;
  status: string;
  starts_at: string;
  doctor_id: string;
  clinic_id: string;
  type_id: string;
  type: { name: string; duration_min: number };
  clinic: { name: string; address: string | null; maps_url: string | null; timezone: string };
  patient: { full_name: string };
}

interface PeekResult {
  ok: boolean;
  purpose?: TokenPurpose;
  appointment?: TokenAppointment;
  error?: string;
}

interface SlotsResult {
  ok: boolean;
  slots?: SlotRow[];
  error?: string;
}

interface ExecuteResult {
  ok: boolean;
  purpose?: TokenPurpose;
  appointment?: TokenAppointment;
  error?: string;
}

async function callAction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("appointment-action", { body });
  if (error) throw error;
  return data as T;
}

export function usePeekToken(token: string) {
  return useQuery({
    queryKey: ["token-peek", token],
    queryFn: () => callAction<PeekResult>({ token, mode: "peek" }),
    retry: false,
  });
}

export function useTokenSlots(token: string, enabled: boolean) {
  return useQuery({
    queryKey: ["token-slots", token],
    enabled,
    queryFn: () => callAction<SlotsResult>({ token, mode: "slots" }),
    retry: false,
  });
}

export function useExecuteToken() {
  return useMutation({
    mutationFn: (params: { token: string; new_start?: string }) =>
      callAction<ExecuteResult>({ token: params.token, mode: "execute", new_start: params.new_start }),
  });
}
