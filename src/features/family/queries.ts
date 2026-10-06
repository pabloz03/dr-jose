import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type Profile = Tables<"profiles">;
type Patient = Tables<"patients">;

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useSaveProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"profiles">, "user_id">) => {
      if (!userId) throw new Error("Sin sesión");
      const payload: TablesInsert<"profiles"> = { ...values, user_id: userId };
      const { data, error } = await supabase.from("profiles").upsert(payload).select().single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

export function usePatients() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["patients", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function useSavePatient() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async (values: { id?: string; full_name: string; birth_date: string | null; is_self: boolean }) => {
      if (!userId) throw new Error("Sin sesión");
      if (values.id) {
        const update: TablesUpdate<"patients"> = {
          full_name: values.full_name,
          birth_date: values.birth_date,
          is_self: values.is_self,
        };
        const { data, error } = await supabase.from("patients").update(update).eq("id", values.id).select().single();
        if (error) throw error;
        return data as Patient;
      }
      const insert: TablesInsert<"patients"> = {
        full_name: values.full_name,
        birth_date: values.birth_date,
        is_self: values.is_self,
        guardian_user_id: userId,
      };
      const { data, error } = await supabase.from("patients").insert(insert).select().single();
      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients", userId] }),
  });
}

export function useRemovePatient() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from("patients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients", userId] }),
  });
}

export function useClaimableGuestPatients() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["claimable-guest-patients", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("claimable_guest_patients");
      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function useClaimPatients() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async (patientIds: string[]) => {
      const { data, error } = await supabase.rpc("claim_patients", { p_patient_ids: patientIds });
      if (error) throw error;
      return data as Patient[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", userId] });
      queryClient.invalidateQueries({ queryKey: ["claimable-guest-patients", userId] });
    },
  });
}
