import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireDoctor } from "@/features/auth/RequireDoctor";
import { RequireStaff } from "@/features/auth/RequireStaff";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { es } from "@/i18n/es";

const HomePage = lazy(() => import("@/features/home/HomePage").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import("@/features/auth/SignUpPage").then((m) => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);
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
const TodayPage = lazy(() => import("@/features/admin/today/TodayPage").then((m) => ({ default: m.TodayPage })));
const CalendarPage = lazy(() =>
  import("@/features/admin/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const PatientsPage = lazy(() =>
  import("@/features/admin/patients/PatientsPage").then((m) => ({ default: m.PatientsPage })),
);
const DashboardPage = lazy(() =>
  import("@/features/admin/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AdminAppointmentDetailPage = lazy(() =>
  import("@/features/admin/appointments/AdminAppointmentDetailPage").then((m) => ({
    default: m.AdminAppointmentDetailPage,
  })),
);
const ManualBookingPage = lazy(() =>
  import("@/features/admin/appointments/ManualBookingPage").then((m) => ({ default: m.ManualBookingPage })),
);
const TimeOffPage = lazy(() =>
  import("@/features/admin/timeoff/TimeOffPage").then((m) => ({ default: m.TimeOffPage })),
);
const TokenActionPage = lazy(() =>
  import("@/features/action/TokenActionPage").then((m) => ({ default: m.TokenActionPage })),
);
const AyudaPage = lazy(() => import("@/features/help/AyudaPage").then((m) => ({ default: m.AyudaPage })));
const GuestBookingPage = lazy(() =>
  import("@/features/booking/guest/GuestBookingPage").then((m) => ({ default: m.GuestBookingPage })),
);
const PatientLayout = lazy(() =>
  import("@/features/home/PatientLayout").then((m) => ({ default: m.PatientLayout })),
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

/** El personal (doctor/asistente) aterriza directo en /admin, nunca en el inicio de paciente. */
function HomeOrAdminRedirect({ children }: { children: ReactNode }) {
  const staffQuery = useMyStaff();

  if (staffQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        {es.common.cargando}
      </div>
    );
  }

  if (staffQuery.data) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Lazy>
        <RequireAuth>
          <HomeOrAdminRedirect>
            <PatientLayout>
              <HomePage />
            </PatientLayout>
          </HomeOrAdminRedirect>
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
          <PatientLayout>
            <ProfilePage />
          </PatientLayout>
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
          <PatientLayout>
            <AppointmentsPage />
          </PatientLayout>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/citas/:id",
    element: (
      <Lazy>
        <RequireAuth>
          <PatientLayout>
            <AppointmentDetailPage />
          </PatientLayout>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <TodayPage />
          </RequireStaff>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/calendario",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <CalendarPage />
          </RequireStaff>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/pacientes",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <PatientsPage />
          </RequireStaff>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/metricas",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <DashboardPage />
          </RequireStaff>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/citas/nueva",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <ManualBookingPage />
          </RequireStaff>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/admin/citas/:id",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireStaff>
            <AdminAppointmentDetailPage />
          </RequireStaff>
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
    path: "/admin/bloqueos",
    element: (
      <Lazy>
        <RequireAuth>
          <RequireDoctor>
            <TimeOffPage />
          </RequireDoctor>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/ayuda",
    element: (
      <Lazy>
        <RequireAuth>
          <PatientLayout>
            <AyudaPage />
          </PatientLayout>
        </RequireAuth>
      </Lazy>
    ),
  },
  {
    path: "/a/:token",
    element: (
      <Lazy>
        <TokenActionPage />
      </Lazy>
    ),
  },
  {
    path: "/reservar-invitado",
    element: (
      <Lazy>
        <GuestBookingPage />
      </Lazy>
    ),
  },
  {
    path: "/crear-cuenta",
    element: (
      <Lazy>
        <SignUpPage />
      </Lazy>
    ),
  },
  {
    path: "/recuperar",
    element: (
      <Lazy>
        <ForgotPasswordPage />
      </Lazy>
    ),
  },
  {
    path: "/recuperar/confirmar",
    element: (
      <Lazy>
        <ResetPasswordPage />
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
