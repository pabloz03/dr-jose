import { useEffect, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Accessibility, HelpCircle, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { es } from "@/i18n/es";
import { useClinic } from "@/features/booking/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AyudaPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clinicQuery = useClinic();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const clinic = clinicQuery.data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <HelpCircle className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.ayuda.titulo}
      </h1>

      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Phone className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
          {es.ayuda.contactoTitulo}
        </h2>
        {clinicQuery.isLoading ? (
          <p className="mt-2 text-muted" role="status">
            {es.common.cargando}
          </p>
        ) : !clinic ? (
          <p className="mt-2 text-muted">{es.ayuda.sinClinica}</p>
        ) : (
          <Card className="mt-3 flex flex-col gap-2">
            <p className="font-medium text-ink">{clinic.name}</p>
            {clinic.address ? <p className="text-sm text-muted">{clinic.address}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {clinic.phone ? (
                <Button variant="secondary" onPress={() => window.open(`tel:${clinic.phone}`, "_self")}>
                  <Phone className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  {es.ayuda.llamar}
                </Button>
              ) : null}
              {clinic.whatsapp ? (
                <Button
                  variant="secondary"
                  onPress={() => window.open(`https://wa.me/${clinic.whatsapp!.replace(/\D/g, "")}`, "_blank", "noopener")}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  {es.ayuda.escribirWhatsapp}
                </Button>
              ) : null}
              {clinic.maps_url ? (
                <Button variant="secondary" onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}>
                  <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  {es.ayuda.comoLlegar}
                </Button>
              ) : null}
            </div>
          </Card>
        )}
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldCheck className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
          {es.ayuda.privacidadTitulo}
        </h2>
        <p className="mt-2 text-sm text-muted">{es.ayuda.privacidadVerPerfil}</p>
        <RouterLink to="/perfil" className="mt-2 inline-block text-accent underline">
          {es.ayuda.irAlPerfil}
        </RouterLink>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Accessibility className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
          {es.ayuda.accesibilidadTitulo}
        </h2>
        <p className="mt-2 text-sm text-ink">{es.ayuda.accesibilidadIntro}</p>
        <p className="mt-2 text-sm text-muted">{es.ayuda.accesibilidadVerificado}</p>
        <p className="mt-2 text-sm text-muted">{es.ayuda.accesibilidadPendiente}</p>
        <p className="mt-2 text-sm text-ink">{es.ayuda.accesibilidadContacto}</p>
      </section>
    </main>
  );
}
