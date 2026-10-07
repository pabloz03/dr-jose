import { Link as RouterLink } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Button } from "@/components/ui/Button";

export function HomePage() {
  const staffQuery = useMyStaff();
  const isStaff = !!staffQuery.data;

  return (
    <main className="min-h-dvh px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">Citas Ortodoncia</h1>
      <p className="mt-2 text-muted">Próxima cita destacada llega en una iteración futura.</p>
      <nav className="mt-6 flex flex-col items-start gap-3">
        <RouterLink to="/citas/nueva" className="text-accent underline">
          Reservar cita
        </RouterLink>
        <RouterLink to="/citas" className="text-accent underline">
          Mis citas
        </RouterLink>
        <RouterLink to="/perfil" className="text-accent underline">
          Mi perfil
        </RouterLink>
        {isStaff ? (
          <RouterLink to="/admin" className="text-accent underline">
            Administración
          </RouterLink>
        ) : null}
        <Button
          variant="secondary"
          onPress={async () => {
            await supabase.auth.signOut();
          }}
        >
          Cerrar sesión
        </Button>
      </nav>
    </main>
  );
}
