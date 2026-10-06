import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/database.types";

/** Fila de staff del usuario autenticado, o null si no es staff (paciente). */
export function useMyStaff() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["my-staff", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Tables<"staff"> | null;
    },
  });
}
