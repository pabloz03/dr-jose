import type { ReactNode } from "react";
import { ModalOverlay, Modal as RACModal, type ModalOverlayProps } from "react-aria-components/Modal";
import { Dialog as RACDialog, Heading } from "react-aria-components/Dialog";

export interface DialogProps extends ModalOverlayProps {
  title: string;
  children: ReactNode;
}

/**
 * Diálogo modal centrado. Foco atrapado y devuelto al disparador al
 * cerrar (lo maneja RAC); Esc y clic fuera cierran salvo que el caller
 * pase isDismissable={false}/isKeyboardDismissDisabled.
 */
export function Dialog({ title, children, ...props }: DialogProps) {
  return (
    <ModalOverlay
      {...props}
      className="react-aria-ModalOverlay fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 data-[entering]:[animation:modal-fade_200ms] data-[exiting]:[animation:modal-fade_150ms_reverse_ease-in]"
    >
      <RACModal className="glass react-aria-Modal w-full max-w-md max-h-[90vh] overflow-y-auto p-6 data-[entering]:[animation:modal-zoom_200ms] data-[exiting]:[animation:modal-fade_150ms_reverse_ease-in]">
        <RACDialog className="outline-none">
          <Heading slot="title" className="text-lg font-semibold text-ink">
            {title}
          </Heading>
          <div className="mt-3">{children}</div>
        </RACDialog>
      </RACModal>
    </ModalOverlay>
  );
}
