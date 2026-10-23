import { Button } from "@/components/ui/Button";

/**
 * Pie fijo del wizard de reserva: CTA primario de ancho completo +
 * una leyenda de una línea debajo resumiendo la elección actual del
 * paso (ej. "Savia Chamberí", "Jue, 12 nov · 16:00–16:30"). Vive
 * dentro de un `<main>` `min-h-dvh flex flex-col` — `sticky bottom-0
 * mt-auto` lo pega abajo del viewport cuando el contenido es corto y
 * se desplaza con la página cuando es largo, sin tapar contenido.
 */
export function StepFooter({
  onPress,
  label,
  caption,
  isPending,
  isDisabled,
}: {
  onPress: () => void;
  label: string;
  caption?: string;
  isPending?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col items-center gap-1 border-t border-line bg-bg pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      <Button variant="primary" size="lg" className="w-full" onPress={onPress} isPending={isPending} isDisabled={isDisabled}>
        {label}
      </Button>
      {caption ? <p className="text-sm text-muted">{caption}</p> : null}
    </div>
  );
}
