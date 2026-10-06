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

export const toastQueue = new ToastQueue<ToastPayload>();

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
      className={`glass flex min-h-tap items-start gap-3 border-l-4 p-4 ${toneClass[tone]} data-[entering]:[animation:modal-fade_150ms] data-[exiting]:[animation:modal-fade_150ms_reverse_ease-in]`}
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
      <Button slot="close" variant="quiet" aria-label="Cerrar notificación" className="!min-h-0 !px-2">
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
