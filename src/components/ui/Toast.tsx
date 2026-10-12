import {
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastContent as ToastContent,
  Text,
  type ToastProps,
} from "react-aria-components/Toast";
import { Button } from "./Button";

export interface ToastPayload {
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "danger";
}

// maxVisibleToasts acota el apilamiento (por defecto Infinity al
// instanciar ToastQueue directamente, a diferencia del hook
// useToastState que sí defaultea a 1) — sin esto, varias acciones
// seguidas dejarían toasts permanentes tapando el nav inferior del
// paciente (hallazgo de a11y-auditor).
export const toastQueue = new ToastQueue<ToastPayload>({ maxVisibleToasts: 3 });

/** Único punto de entrada para mostrar un toast — centraliza el timeout de auto-cierre (ningún toast debe quedar permanente, regla dura #13/2.4.11). */
export function showToast(payload: ToastPayload) {
  toastQueue.add(payload, { timeout: 5000 });
}

const toneClass: Record<NonNullable<ToastPayload["tone"]>, string> = {
  neutral: "border-border-ui",
  success: "border-success",
  danger: "border-danger",
};

function AppToast(props: ToastProps<ToastPayload>) {
  const tone = props.toast.content.tone ?? "neutral";
  return (
    <RACToast
      {...props}
      className={`glass flex min-h-tap items-start gap-3 border-l-4 p-4 ${toneClass[tone]} data-[entering]:[animation:modal-fade_150ms] data-[exiting]:[animation:modal-fade_150ms_reverse_ease-in] motion-reduce:data-[entering]:[animation:modal-fade_1ms] motion-reduce:data-[exiting]:[animation:modal-fade_1ms_reverse]`}
    >
      <ToastContent className="flex-1">
        <Text slot="title" className="font-semibold text-ink">
          {props.toast.content.title}
        </Text>
        {props.toast.content.description ? (
          <Text slot="description" className="text-sm text-muted">
            {props.toast.content.description}
          </Text>
        ) : null}
      </ToastContent>
      <Button slot="close" variant="quiet" aria-label="Cerrar notificación" className="!px-2">
        ✕
      </Button>
    </RACToast>
  );
}

/** Montar una vez en la raíz de la app; usar `toastQueue.add(...)` para mostrar. */
export function AppToastRegion() {
  return (
    <ToastRegion
      queue={toastQueue}
      className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2"
    >
      {({ toast }) => <AppToast toast={toast} />}
    </ToastRegion>
  );
}
