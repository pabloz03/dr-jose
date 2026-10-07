import { useEffect, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { es } from "@/i18n/es";
import { useClinic } from "@/features/booking/queries";
import { Button } from "@/components/ui/Button";

export function AyudaPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clinicQuery = useClinic();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const clinic = clinicQuery.data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.ayuda.titulo}
      </h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-ink">{es.ayuda.contactoTitulo}</h2>
        {clinicQuery.isLoading ? (
          <p className="mt-2 text-muted" role="status">
            {es.common.cargando}
          </p>
        ) : !clinic ? (
          <p className="mt-2 text-muted">{es.ayuda.sinClinica}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-ink">{clinic.name}</p>
            {clinic.address ? <p className="text-sm text-muted">{clinic.address}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {clinic.phone ? (
                <Button variant="secondary" onPress={() => window.open(`tel:${clinic.phone}`, "_self")}>
                  {es.ayuda.llamar}
                </Button>
              ) : null}
              {clinic.whatsapp ? (
                <Button
                  variant="secondary"
                  onPress={() => window.open(`https://wa.me/${clinic.whatsapp!.replace(/\D/g, "")}`, "_blank", "noopener")}
                >
                  {es.ayuda.escribirWhatsapp}
                </Button>
              ) : null}
              {clinic.maps_url ? (
                <Button variant="secondary" onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}>
                  {es.ayuda.comoLlegar}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">{es.ayuda.privacidadTitulo}</h2>
        <p className="mt-2 text-sm text-muted">{es.ayuda.privacidadVerPerfil}</p>
        <RouterLink to="/perfil" className="mt-2 inline-block text-accent underline">
          {es.ayuda.irAlPerfil}
        </RouterLink>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">{es.ayuda.accesibilidadTitulo}</h2>
        <p className="mt-2 text-sm text-ink">{es.ayuda.accesibilidadIntro}</p>
        <p className="mt-2 text-sm text-muted">{es.ayuda.accesibilidadVerificado}</p>
        <p className="mt-2 text-sm text-muted">{es.ayuda.accesibilidadPendiente}</p>
        <p className="mt-2 text-sm text-ink">{es.ayuda.accesibilidadContacto}</p>
      </section>
    </main>
  );
}
