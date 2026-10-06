import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireDoctor } from "@/features/auth/RequireDoctor";
import { es } from "@/i18n/es";

const HomePage = lazy(() => import("@/features/home/HomePage").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const ProfilePage = lazy(() => import("@/features/family/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const BookingPage = lazy(() => import("@/features/booking/BookingPage").then((m) => ({ default: m.BookingPage })));
const AppointmentsPage = lazy(() =>
  import("@/features/appointments/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })),
);
const AppointmentDetailPage = lazy(() =>
  import("@/features/appointments/AppointmentDetailPage").then((m) => ({ default: m.AppointmentDetailPage })),
);
const UiKitPage = lazy(() => import("@/features/ui-kit/UiKitPage").then((m) => ({ default: m.UiKitPage })));
const ClinicsPage = lazy(() =>
  import("@/features/admin/clinics/ClinicsPage").then((m) => ({ default: m.ClinicsPage })),
);
const AjustesPage = lazy(() =>
  import("@/features/admin/settings/AjustesPage").then((m) => ({ default: m.AjustesPage })),
);
const HorariosPage = lazy(() =>
  import("@/features/admin/schedule/HorariosPage").then((m) => ({ default: m.HorariosPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
      {es.common.cargando}
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Lazy>
        <RequireAuth>
          <HomePage />
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/ingresar",
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },
  {
    path: "/perfil",
    element: (
      <Lazy>
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/citas/nueva",
    element: (
      <Lazy>
        <RequireAuth>
          <BookingPage />
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/citas",
    element: (
      <Lazy>
        <RequireAuth>
          <AppointmentsPage />
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/citas/:id",
    element: (
      <Lazy>
        <RequireAuth>
          <AppointmentDetailPage />
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/clinicas",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireDoctor>
            <ClinicsPage />
          </RequireDoctor>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/ajustes",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireDoctor>
            <AjustesPage />
          </RequireDoctor>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/horarios",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireDoctor>
            <HorariosPage />
          </RequireDoctor>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/_ui",
    element: (
      <Lazy>
        <UiKitPage />
      </Lazy>
    ),
  },
]);
