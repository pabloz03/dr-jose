import { useState } from "react";
import { DialogTrigger } from "react-aria-components/Dialog";
import { Check, CircleDot, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { toastQueue } from "@/components/ui/Toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line pb-8">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

export function UiKitPage() {
  const [liveMessage, setLiveMessage] = useState("");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="font-display text-2xl text-ink">/_ui — primitivas</h1>
      <p className="text-muted">
        Kitchen sink de E0-S2 (ampliado en el rediseño premium). Cada primitiva usa solo tokens de{" "}
        <code>tokens.css</code>; estados hover/focus/disabled/error se prueban con teclado (Tab) y axe.
      </p>

      <Section title="Tipografía">
        <div className="flex flex-col gap-2">
          <Eyebrow>Eyebrow — etiqueta editorial</Eyebrow>
          <p className="font-display text-3xl text-ink">Montserrat — h1 de página</p>
          <p className="font-display text-lg text-ink">Montserrat — h2 de sección</p>
          <p className="text-base text-ink">Open Sans — cuerpo de texto, el resto de la app hereda esto por defecto.</p>
          <p className="text-sm text-muted">Open Sans — texto secundario/ayuda.</p>
        </div>
      </Section>

      <Section title="Button">
        <Button variant="primary">Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="danger">Peligro</Button>
        <Button variant="quiet">Quiet</Button>
        <Button variant="primary" isDisabled>
          Deshabilitado
        </Button>
        <Button variant="primary" isPending>
          Procesando
        </Button>
      </Section>

      <Section title="Bloque hero (invariante de tema — solo Home/paciente)">
        <div className="w-full rounded-[var(--r-lg)] bg-[var(--hero-bg)] p-5 text-[var(--hero-ink)]">
          <Eyebrow onDark>Su próxima cita</Eyebrow>
          <p className="font-display mt-1 text-xl">Control — María López</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success" onDark icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}>
              Confirmada
            </Badge>
            <Button variant="hero">Ver detalle</Button>
          </div>
        </div>
      </Section>

      <Section title="Field / Input">
        <div className="w-full max-w-sm">
          <Field
            label="Nombre completo"
            description="Como aparece en su documento."
            inputProps={{ placeholder: "Ej. María López" }}
          />
        </div>
        <div className="w-full max-w-sm">
          <Field label="Correo" isRequired inputProps={{ name: "email", type: "email", placeholder: "correo@ejemplo.com" }} />
        </div>
        <div className="w-full max-w-sm">
          <Field label="Campo con error" isInvalid errorMessage="Este campo es obligatorio." inputProps={{ placeholder: "…" }} />
        </div>
      </Section>

      <Section title="Badge (texto + icono, nunca solo color)">
        <Badge tone="success" icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}>
          Confirmada
        </Badge>
        <Badge tone="warning" icon={<CircleDot className="h-3.5 w-3.5" strokeWidth={2.5} />}>
          Pendiente
        </Badge>
        <Badge tone="danger" icon={<X className="h-3.5 w-3.5" strokeWidth={2.5} />}>
          Cancelada
        </Badge>
        <Badge tone="neutral" icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />}>
          Reprogramada
        </Badge>
      </Section>

      <Section title="Card (listas con scroll — sin glass)">
        <Card className="w-full max-w-sm">
          <p className="font-medium text-ink">Control — María López</p>
          <p className="text-sm text-muted">Mar. 10 nov · 3:00 p.m.</p>
        </Card>
        <Card className="w-full max-w-sm" onPress={() => setLiveMessage("Tarjeta presionada")}>
          <p className="font-medium text-ink">Tarjeta interactiva (onPress)</p>
          <p className="text-sm text-muted">Toda el área es un botón accesible.</p>
        </Card>
      </Section>

      <Section title="GlassSurface (solo: header sticky, próxima cita, sheets/diálogos/toasts — nunca listas ni calendario)">
        <GlassSurface className="w-full max-w-sm p-4">
          <p className="font-medium text-ink">Próxima cita</p>
          <p className="text-sm text-muted">Mar. 10 nov · 3:00 p.m.</p>
        </GlassSurface>
      </Section>

      <Section title="Dialog">
        <DialogTrigger>
          <Button variant="secondary">Abrir diálogo</Button>
          <Dialog title="Confirmar acción">
            <p className="text-sm text-muted">Esto es un diálogo centrado de ejemplo.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button slot="close" variant="quiet">
                Cancelar
              </Button>
              <Button slot="close" variant="primary">
                Confirmar
              </Button>
            </div>
          </Dialog>
        </DialogTrigger>
      </Section>

      <Section title="Sheet">
        <DialogTrigger>
          <Button variant="secondary">Abrir hoja</Button>
          <Sheet title="Elegir acción">
            <p className="text-sm text-muted">Esto es una hoja inferior de ejemplo.</p>
            <Button slot="close" variant="primary" className="mt-4 w-full">
              Cerrar
            </Button>
          </Sheet>
        </DialogTrigger>
      </Section>

      <Section title="Toast">
        <Button
          variant="secondary"
          onPress={() =>
            toastQueue.add({ title: "Cita confirmada", description: "Le enviamos un comprobante por correo.", tone: "success" })
          }
        >
          Mostrar toast
        </Button>
      </Section>

      <Section title="LiveRegion">
        <Button variant="secondary" onPress={() => setLiveMessage(`Anuncio ${Date.now()}`)}>
          Disparar anuncio aria-live
        </Button>
        <LiveRegion message={liveMessage} />
      </Section>
    </main>
  );
}
