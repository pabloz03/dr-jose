import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components/I18nProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider locale="es-GT">
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MotionConfig>
    </I18nProvider>
  );
}
