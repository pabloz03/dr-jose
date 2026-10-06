import { useState } from "react";
import { DialogTrigger } from "react-aria-components/Dialog";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { toastQueue } from "@/components/ui/Toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line pb-8">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

export function UiKitPage() {
  const [liveMessage, setLiveMessage] = useState("");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">/_ui — primitivas</h1>
      <p className="text-muted">
        Kitchen sink de E0-S2. Cada primitiva usa solo tokens de <code>tokens.css</code>; estados
        hover/focus/disabled/error se prueban con teclado (Tab) y axe.
      </p>

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
        <Badge tone="success" icon="✓">
          Confirmada
        </Badge>
        <Badge tone="warning" icon="●">
          Pendiente
        </Badge>
        <Badge tone="danger" icon="✕">
          Cancelada
        </Badge>
        <Badge tone="neutral" icon="↻">
          Reprogramada
        </Badge>
      </Section>

      <Section title="GlassSurface">
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
