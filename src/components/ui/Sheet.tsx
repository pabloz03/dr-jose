import type { ReactNode } from "react";
import { ModalOverlay, Modal as RACModal, type ModalOverlayProps } from "react-aria-components/Modal";
import { Dialog as RACDialog, Heading } from "react-aria-components/Dialog";

export interface SheetProps extends ModalOverlayProps {
  title: string;
  children: ReactNode;
}

/** Hoja inferior, mobile-first (p. ej. selector de acciones, filtros). */
export function Sheet({ title, children, ...props }: SheetProps) {
  return (
    <ModalOverlay
      {...props}
      className="react-aria-ModalOverlay fixed inset-0 z-50 flex items-end justify-center bg-ink/50 data-[entering]:[animation:modal-fade_200ms] data-[exiting]:[animation:modal-fade_150ms_reverse_ease-in]"
    >
      <RACModal className="glass react-aria-Modal w-full max-w-md max-h-[85vh] overflow-y-auto rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[entering]:[animation:sheet-slide-up_240ms_cubic-bezier(0.16,1,0.3,1)] data-[exiting]:[animation:sheet-slide-up_200ms_reverse_ease-in]">
        <RACDialog className="outline-none">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
          <Heading slot="title" className="text-lg font-semibold text-ink">
            {title}
          </Heading>
          <div className="mt-3">{children}</div>
        </RACDialog>
      </RACModal>
    </ModalOverlay>
  );
}
