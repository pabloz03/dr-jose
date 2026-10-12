import { useEffect, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Building2, HelpCircle, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { es } from "@/i18n/es";
import { useClinic } from "@/features/booking/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export function AyudaPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clinicQuery = useClinic();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const clinic = clinicQuery.data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
        <HelpCircle className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.ayuda.titulo}
      </h1>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Phone className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
          {es.ayuda.contactoTitulo}
        </h2>
        {clinicQuery.isLoading ? (
          <div className="mt-3">
            <SkeletonCard />
          </div>
        ) : clinicQuery.isError ? (
          <div className="mt-3">
            <ErrorState onRetry={() => clinicQuery.refetch()} />
          </div>
        ) : !clinic ? (
          <div className="mt-3">
            <EmptyState icon={<Building2 className="h-8 w-8" strokeWidth={2.25} />} title={es.ayuda.sinClinica} />
          </div>
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

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldCheck className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
          {es.ayuda.privacidadTitulo}
        </h2>
        <p className="mt-2 text-sm text-muted">{es.ayuda.privacidadVerPerfil}</p>
        <RouterLink to="/perfil" className="mt-2 inline-block text-accent underline">
          {es.ayuda.irAlPerfil}
        </RouterLink>
      </section>
    </main>
  );
}
