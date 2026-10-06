# Citas Ortodoncia — Handoff para Claude Code

**Versión:** 1.0 · **Fecha:** 2026-10-06 · **Fase:** pre-desarrollo
**Cliente:** Dr. José Rodríguez (ortodoncista, Ciudad de Guatemala) · **Producto:** PWA de gestión de citas
**Documento hermano:** `Research-Citas-Ortodoncia-Dr-Rodriguez.pdf` (research, personas, JTBD, benchmark, justificación de decisiones)

> Este archivo es autosuficiente. Léelo completo antes de escribir código. Todo lo marcado `[SUPUESTO]` tiene un default usable pero debe validarse con el doctor. Todo lo marcado `[DECIDIDO]` no se renegocia sin pedírselo al dueño del producto.

---

## 1. Objetivo y alcance

Web app en React que permite:

**Paciente / tutor (mobile-first)**
- Reservar, ver, confirmar, cancelar y reprogramar citas con base en la disponibilidad real del doctor.
- Gestionar varios pacientes bajo una cuenta (tutor + hijos).
- Recibir un **email 24 h antes** (día previo) con acciones de un toque: confirmar / reprogramar / cancelar, sin iniciar sesión.

**Doctor**
- Ver calendario completo (mes / semana) y por día; modo "Hoy".
- Bloquear fechas/rangos/franjas en las que no estará.
- Editar días y horas de trabajo **por clínica**; modelo multi-clínica desde el día 1 (UI de una clínica en MVP).
- Crear/mover/cancelar citas en nombre del paciente y marcar asistencia.

> **FUERA DE ALCANCE:** expedientes clínicos, facturación, pagos, teleconsulta, chat. Cualquier propuesta en esa dirección requiere decisión formal. No introducir campos clínicos en la base de datos.

## 2. Decisiones cerradas `[DECIDIDO]`

| # | Decisión |
|---|---|
| D1 | Auth del paciente: **enlace mágico / OTP por email**, sin contraseña. Permitir pegar el código (WCAG 3.3.8). |
| D2 | Acciones del email: **token firmado de un solo propósito** + página de aterrizaje + **botón (POST)**. **Jamás mutar con GET** (los escáneres de enlaces de email pre-visitan URLs). |
| D3 | **Cuenta familiar**: `patients.guardian_user_id` (tutor) → muchos pacientes. Adultos: `is_self = true`. |
| D4 | **Multi-clínica en el schema desde el MVP**; la UI oculta el selector si hay una sola clínica. |
| D5 | Canal de recordatorio abstraído (`channel`); MVP = email; R2 = WhatsApp/SMS. |
| D6 | **Doble reserva imposible en BD** (exclusion constraint). |
| D7 | Zona horaria `America/Guatemala` (UTC−6, sin DST). Persistir `timestamptz` en UTC. |
| D8 | WCAG **2.2 AA** es condición de merge. |
| D9 | Glassmorphism acotado y con fallbacks sólidos; Motion respeta `prefers-reduced-motion`. |
| D10 | Citas no confirmadas **no se auto-cancelan** en v1. |

## 3. Supuestos con default `[SUPUESTO — VALIDAR]`

| Tema | Default |
|---|---|
| Anticipación mínima para cancelar/reprogramar online | 24 h |
| Ventana máxima de reserva | 90 días |
| Paso de slots | 10 min |
| Hora de envío del recordatorio | 10:00 local, día calendario previo |
| Tipos de cita (editables) | Primera consulta 40 min · Control 20 min · Colocación 60 min · Retiro 60 min · Urgencia 20 min |
| Tratamiento de "usted/tú" en copy | **usted** |
| Idioma | Solo español (es-GT); preparar i18n con claves |
| Antelación mínima de reserva | 2 h |

## 4. Stack

| Capa | Elección |
|---|---|
| Frontend | Vite + React + TypeScript (strict), React Router, TanStack Query, react-hook-form + Zod |
| UI | Tailwind CSS + **React Aria Components** (calendarios, date pickers, dialogs) |
| Motion | `motion` (`import { motion, AnimatePresence, MotionConfig } from "motion/react"`). `framer-motion` es equivalente si ya está instalado |
| Fechas | `date-fns` + `date-fns-tz` |
| PWA | `vite-plugin-pwa` |
| Backend | Supabase: Postgres + RLS, Auth (OTP), Edge Functions (Deno), `pg_cron`, `pg_net` |
| Email | Resend (HTML + texto plano), SPF/DKIM/DMARC en el dominio de la clínica |
| Hosting/CI | Vercel + GitHub Actions |
| Calidad | Vitest, Testing Library, Playwright + `@axe-core/playwright`, Lighthouse CI, `eslint-plugin-jsx-a11y` |
| Observabilidad | Sentry (sin PII), analítica sin cookies de terceros |

## 5. Estructura del repositorio

```
/
├─ CLAUDE.md
├─ .claude/
│  ├─ agents/{a11y-auditor,db-reviewer,tz-reviewer,copy-gt}.md
│  ├─ commands/{new-migration,a11y-check,slot-test}.md
│  └─ settings.json
├─ src/
│  ├─ app/{router.tsx,providers.tsx}
│  ├─ components/ui/{Button,Input,Field,Dialog,Sheet,Calendar,DatePicker,Stepper,Badge,Toast,GlassSurface,LiveRegion}.tsx
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ family/                # tutor + pacientes
│  │  ├─ booking/               # stepper, slots
│  │  ├─ appointments/          # lista, detalle, acciones
│  │  ├─ action-link/           # /a/:token
│  │  └─ admin/{today,calendar,schedule,timeoff,clinics,settings,patients}/
│  ├─ lib/{supabase.ts,tz.ts,dates.ts,motion.ts,ics.ts,a11y.ts}
│  ├─ styles/{tokens.css,glass.css,base.css}
│  └─ test/
├─ supabase/
│  ├─ migrations/
│  ├─ functions/{send-reminders,appointment-action,_shared}/
│  └─ seed.sql
├─ emails/                       # plantillas HTML/texto
└─ e2e/                          # Playwright + axe
```

## 6. `CLAUDE.md` (copiar a la raíz)

```markdown
# Citas Ortodoncia — Reglas del proyecto

## Comandos
- dev: `pnpm dev` · build: `pnpm build` · typecheck: `pnpm tsc --noEmit`
- lint: `pnpm lint` · unit: `pnpm test` · e2e: `pnpm e2e` · a11y: `pnpm e2e --grep @a11y`
- db: `supabase db reset` · tipos: `supabase gen types typescript --local > src/lib/database.types.ts`

## Reglas duras
1. WCAG 2.2 AA es condición de merge. Toda pantalla nueva pasa axe (0 críticas/serias) y navegación solo por teclado.
2. Prohibido hex/rgb fuera de `styles/tokens.css`. Usar tokens.
3. Fechas: solo vía `lib/tz.ts` (`America/Guatemala`). Prohibido `new Date("YYYY-MM-DDTHH:mm")` sin zona y asumir DST.
4. Un GET nunca muta estado. Acciones de email = POST desde botón.
5. La disponibilidad se calcula en Postgres (`get_available_slots`). El cliente nunca decide si un slot es válido.
6. Doble reserva se previene en BD (exclusion constraint). Manejar el error `23P01` con mensaje amable.
7. RLS en TODAS las tablas. Pacientes solo ven lo suyo (tutor → sus pacientes → sus citas).
8. Sin PII en logs ni en analítica.
9. Texto de UI en español de Guatemala, tratamiento "usted", claro y corto. Todo string en `src/i18n/es.ts`.
10. Estado nunca solo por color: texto + icono.
11. Motion: `MotionConfig reducedMotion="user"`. Sin animaciones infinitas. Duraciones 120–320 ms.
12. Glass: opacidad ≥ 0.85 (claro) / ≥ 0.90 (oscuro) bajo texto; fallbacks para `prefers-reduced-transparency`, `forced-colors` y sin `backdrop-filter`. Máx. 2 capas glass por viewport; nunca en calendario ni listas con scroll.
13. Objetivos táctiles ≥ 44×44 px. Reflow a 320 px sin scroll horizontal.
14. Al cambiar de paso/ruta: mover el foco al `<h1>`/`<h2>` nuevo y anunciar por `aria-live`.

## Definición de hecho (DoD)
- Tipos y lint limpios · tests unitarios y e2e del flujo · axe sin violaciones · probado a 320/375/768/1280 px
- Probado con teclado y con reduced motion · estados loading/empty/error implementados
- Migraciones con RLS probadas · sin `any` · copy revisado por subagente `copy-gt`

## Subagentes
- `a11y-auditor` en cada PR de UI · `db-reviewer` en cada migración · `tz-reviewer` en cada cambio con fechas · `copy-gt` en copy y emails
```

## 7. Tokens de diseño

```css
/* styles/tokens.css */
:root {
  color-scheme: light dark;
  --bg: #F5F7F8;  --surface: #FFFFFF;
  --ink: #0E1B20; --muted: #4A5A62;
  --accent: #0A6F6A; --accent-hover: #085A56; --on-accent: #FFFFFF;
  --border-ui: #6F8089; --line: #D5DDE1;
  --danger: #B42318; --success: #067647; --warning: #8A4B08;
  --focus: #1D4ED8;
  --glass-bg: rgb(255 255 255 / 0.86);
  --glass-border: rgb(255 255 255 / 0.55);
  --glass-blur: 16px;
  --shadow-1: 0 1px 2px rgb(14 27 32 / .06), 0 8px 24px rgb(14 27 32 / .06);
  --r-sm: 12px; --r-md: 16px; --r-lg: 20px;
  --space: 4px;
  --tap: 44px;
  --dur-fast: 150ms; --dur-base: 240ms; --dur-slow: 320ms;
  --font-sans: "Inter Variable", "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0B1317; --surface: #121E24;
    --ink: #E8F0F2; --muted: #A3B4BB;
    --accent: #4FD1C5; --accent-hover: #7BE0D6; --on-accent: #04201E;
    --border-ui: #5F727A; --line: #22323A;
    --danger: #FF8A80; --success: #5FD6A0; --warning: #F5B454;
    --focus: #7DD3FC;
    --glass-bg: rgb(18 30 36 / 0.92);
    --glass-border: rgb(255 255 255 / 0.12);
  }
}
:root[data-theme="dark"] {
  --bg: #0B1317; --surface: #121E24;
  --ink: #E8F0F2; --muted: #A3B4BB;
  --accent: #4FD1C5; --accent-hover: #7BE0D6; --on-accent: #04201E;
  --border-ui: #5F727A; --line: #22323A;
  --danger: #FF8A80; --success: #5FD6A0; --warning: #F5B454;
  --focus: #7DD3FC;
  --glass-bg: rgb(18 30 36 / 0.92);
  --glass-border: rgb(255 255 255 / 0.12);
}
```

```css
/* styles/glass.css */
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-1);
  border-radius: var(--r-lg);
}
@supports (backdrop-filter: blur(1px)) {
  .glass { backdrop-filter: blur(var(--glass-blur)) saturate(1.2); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--surface); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
@media (forced-colors: active) {
  .glass { background: Canvas; border: 1px solid CanvasText; backdrop-filter: none; }
}
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
```

```ts
// tailwind.config.ts (extracto)
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", ink: "var(--ink)", muted: "var(--muted)",
        accent: "var(--accent)", "on-accent": "var(--on-accent)", line: "var(--line)",
        danger: "var(--danger)", success: "var(--success)", warning: "var(--warning)",
      },
      borderRadius: { sm: "var(--r-sm)", md: "var(--r-md)", lg: "var(--r-lg)" },
      minHeight: { tap: "var(--tap)" }, minWidth: { tap: "var(--tap)" },
      fontFamily: { sans: ["var(--font-sans)"] },
    },
  },
} satisfies import("tailwindcss").Config;
```

```ts
// lib/motion.ts
export const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
export const fade = { duration: 0.15 } as const;
export const stepVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: 20 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24 } },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: -20 * dir, transition: { duration: 0.15 } }),
};
// providers.tsx: <MotionConfig reducedMotion="user">…</MotionConfig>
```

## 8. Base de datos (migración inicial)

```sql
-- 0001_init.sql
create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type appointment_status as enum ('scheduled','confirmed','cancelled','rescheduled','completed','no_show');

create table clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  maps_url text,
  phone text,
  whatsapp text,
  timezone text not null default 'America/Guatemala',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table clinic_doctors (
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  primary key (clinic_id, doctor_id)
);

create table clinic_settings (
  clinic_id uuid primary key references clinics(id) on delete cascade,
  min_cancel_hours int not null default 24,
  min_lead_hours int not null default 2,
  max_booking_days int not null default 90,
  slot_step_min int not null default 10,
  reminder_local_time time not null default '10:00'
);

create table clinic_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1=lunes … 7=domingo
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index on clinic_hours (clinic_id, doctor_id, weekday);

create table schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  on_date date not null,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  note text,
  check ((is_closed and start_time is null and end_time is null) or (not is_closed and start_time is not null and end_time > start_time))
);
create index on schedule_exceptions (clinic_id, doctor_id, on_date);

create table time_off (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade, -- null = todas las clínicas
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index time_off_range on time_off using gist (doctor_id, tstzrange(starts_at, ends_at, '[)'));

create table appointment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_min int not null check (duration_min between 5 and 240),
  buffer_after_min int not null default 0 check (buffer_after_min >= 0),
  bookable_online boolean not null default true,
  is_active boolean not null default true,
  sort smallint not null default 0
);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  locale text not null default 'es-GT',
  notify_email boolean not null default true,
  created_at timestamptz not null default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references auth.users(id) on delete restrict,
  full_name text not null,
  birth_date date,
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on patients (guardian_user_id);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  doctor_id uuid not null references doctors(id),
  patient_id uuid not null references patients(id),
  type_id uuid not null references appointment_types(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'scheduled',
  source text not null check (source in ('patient','doctor')),
  created_by uuid references auth.users(id),
  rescheduled_from uuid references appointments(id),
  cancel_reason text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint no_double_booking exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('scheduled','confirmed'))
);
create index on appointments (patient_id, starts_at);
create index on appointments (clinic_id, starts_at);
create index on appointments (status, starts_at) where reminder_sent_at is null;

create table appointment_tokens (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  purpose text not null check (purpose in ('confirm','cancel','reschedule')),
  token_hash text not null unique, -- sha256 hex
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index on appointment_tokens (appointment_id);

create table notification_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  kind text not null check (kind in ('reminder_24h','booked','cancelled','rescheduled','time_off_notice')),
  channel text not null default 'email',
  to_email text not null,
  provider_id text,
  status text not null default 'sent',
  error text,
  sent_at timestamptz not null default now()
);
create unique index notification_once on notification_log (appointment_id, kind) where kind = 'reminder_24h' and status = 'sent';

create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  actor_type text not null check (actor_type in ('patient','doctor','system')),
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb
);

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger appointments_touch before update on appointments for each row execute function touch_updated_at();
```

```sql
-- 0002_rls.sql
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from doctors where user_id = auth.uid())
$$;

alter table clinics enable row level security;
alter table doctors enable row level security;
alter table clinic_doctors enable row level security;
alter table clinic_settings enable row level security;
alter table clinic_hours enable row level security;
alter table schedule_exceptions enable row level security;
alter table time_off enable row level security;
alter table appointment_types enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table appointment_tokens enable row level security;
alter table notification_log enable row level security;
alter table audit_log enable row level security;

-- Lectura pública autenticada de catálogos
create policy clinics_read on clinics for select to authenticated using (is_active);
create policy doctors_read on doctors for select to authenticated using (true);
create policy clinic_doctors_read on clinic_doctors for select to authenticated using (true);
create policy types_read on appointment_types for select to authenticated using (is_active);
create policy settings_read on clinic_settings for select to authenticated using (true);

-- Staff administra configuración
create policy clinics_staff on clinics for all to authenticated using (is_staff()) with check (is_staff());
create policy settings_staff on clinic_settings for all to authenticated using (is_staff()) with check (is_staff());
create policy hours_staff on clinic_hours for all to authenticated using (is_staff()) with check (is_staff());
create policy exceptions_staff on schedule_exceptions for all to authenticated using (is_staff()) with check (is_staff());
create policy timeoff_staff on time_off for all to authenticated using (is_staff()) with check (is_staff());
create policy types_staff on appointment_types for all to authenticated using (is_staff()) with check (is_staff());
create policy doctors_self on doctors for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Perfiles
create policy profiles_self on profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_staff_read on profiles for select to authenticated using (is_staff());

-- Pacientes: el tutor gestiona los suyos; staff lee
create policy patients_guardian on patients for all to authenticated
  using (guardian_user_id = auth.uid()) with check (guardian_user_id = auth.uid());
create policy patients_staff on patients for select to authenticated using (is_staff());

-- Citas: tutor solo lee las suyas; toda escritura del paciente va por RPC; staff total
create policy appts_guardian_read on appointments for select to authenticated
  using (patient_id in (select id from patients where guardian_user_id = auth.uid()));
create policy appts_staff on appointments for all to authenticated using (is_staff()) with check (is_staff());

-- Tokens, notificaciones y auditoría: solo service role (sin políticas para authenticated)
create policy audit_staff_read on audit_log for select to authenticated using (is_staff());
create policy notif_staff_read on notification_log for select to authenticated using (is_staff());
```

```sql
-- 0003_slots_and_rpc.sql
create or replace function get_available_slots(
  p_clinic uuid, p_doctor uuid, p_type uuid, p_from date, p_to date
) returns table (slot_start timestamptz, slot_end timestamptz)
language sql stable security definer set search_path = public as $$
  with ctx as (
    select c.timezone as tz, t.duration_min, t.buffer_after_min,
           s.slot_step_min, s.min_lead_hours, s.max_booking_days
    from clinics c
    join clinic_settings s on s.clinic_id = c.id
    join appointment_types t on t.id = p_type and t.is_active and t.bookable_online
    where c.id = p_clinic and c.is_active
  ),
  days as (
    select d::date as day, extract(isodow from d)::int as isodow
    from ctx, generate_series(
      p_from::timestamp,
      least(p_to, ((now() at time zone ctx.tz)::date + ctx.max_booking_days))::timestamp,
      interval '1 day') d
  ),
  windows as (
    select dy.day, w.start_time, w.end_time
    from days dy
    join clinic_hours w on w.clinic_id = p_clinic and w.doctor_id = p_doctor and w.weekday = dy.isodow
    where not exists (
      select 1 from schedule_exceptions e
      where e.clinic_id = p_clinic and e.doctor_id = p_doctor and e.on_date = dy.day)
    union all
    select e.on_date, e.start_time, e.end_time
    from schedule_exceptions e
    where e.clinic_id = p_clinic and e.doctor_id = p_doctor
      and e.on_date between p_from and p_to and not e.is_closed
  ),
  candidates as (
    select
      (gs.local_start at time zone ctx.tz) as s,
      ctx.duration_min, ctx.buffer_after_min, ctx.min_lead_hours
    from windows w
    cross join ctx
    cross join lateral generate_series(
      (w.day + w.start_time)::timestamp,
      (w.day + w.end_time)::timestamp - make_interval(mins => ctx.duration_min),
      make_interval(mins => ctx.slot_step_min)
    ) as gs(local_start)
  )
  select c.s, c.s + make_interval(mins => c.duration_min)
  from candidates c
  where c.s >= now() + make_interval(hours => c.min_lead_hours)
    and not exists (
      select 1 from time_off o
      where o.doctor_id = p_doctor and (o.clinic_id is null or o.clinic_id = p_clinic)
        and tstzrange(o.starts_at, o.ends_at, '[)') &&
            tstzrange(c.s, c.s + make_interval(mins => c.duration_min + c.buffer_after_min), '[)'))
    and not exists (
      select 1 from appointments a
      where a.doctor_id = p_doctor and a.status in ('scheduled','confirmed')
        and tstzrange(a.starts_at, a.ends_at, '[)') &&
            tstzrange(c.s, c.s + make_interval(mins => c.duration_min + c.buffer_after_min), '[)'))
  order by c.s
$$;
grant execute on function get_available_slots(uuid,uuid,uuid,date,date) to authenticated;

create or replace function book_appointment(
  p_patient uuid, p_type uuid, p_clinic uuid, p_doctor uuid, p_start timestamptz
) returns appointments
language plpgsql security definer set search_path = public as $$
declare v_dur int; v_row appointments;
begin
  if not exists (select 1 from patients where id = p_patient and guardian_user_id = auth.uid() and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1 from get_available_slots(p_clinic, p_doctor, p_type, (p_start at time zone 'America/Guatemala')::date, (p_start at time zone 'America/Guatemala')::date)
    where slot_start = p_start) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;
  select duration_min into v_dur from appointment_types where id = p_type;
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, source, created_by)
  values (p_clinic, p_doctor, p_patient, p_type, p_start, p_start + make_interval(mins => v_dur), 'patient', auth.uid())
  returning * into v_row;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id) values (auth.uid(), 'patient', 'book', 'appointment', v_row.id);
  return v_row;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = 'P0001';
end $$;
grant execute on function book_appointment(uuid,uuid,uuid,uuid,timestamptz) to authenticated;

create or replace function cancel_appointment(p_id uuid, p_reason text default null)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments; v_min int;
begin
  select a.* into v_row from appointments a
  join patients p on p.id = a.patient_id
  where a.id = p_id and (p.guardian_user_id = auth.uid() or is_staff()) for update of a;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  select min_cancel_hours into v_min from clinic_settings where clinic_id = v_row.clinic_id;
  if not is_staff() and v_row.starts_at < now() + make_interval(hours => v_min) then
    raise exception 'too_late' using errcode = 'P0001';
  end if;
  update appointments set status = 'cancelled', cancel_reason = p_reason, cancelled_at = now()
  where id = p_id returning * into v_row;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id, diff)
  values (auth.uid(), case when is_staff() then 'doctor' else 'patient' end, 'cancel', 'appointment', p_id, jsonb_build_object('reason', p_reason));
  return v_row;
end $$;
grant execute on function cancel_appointment(uuid,text) to authenticated;

create or replace function confirm_appointment(p_id uuid)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  update appointments a set status = 'confirmed', confirmed_at = now()
  from patients p
  where a.id = p_id and p.id = a.patient_id and a.status = 'scheduled'
    and (p.guardian_user_id = auth.uid() or is_staff())
  returning a.* into v_row;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id)
  values (auth.uid(), case when is_staff() then 'doctor' else 'patient' end, 'confirm', 'appointment', p_id);
  return v_row;
end $$;
grant execute on function confirm_appointment(uuid) to authenticated;

create or replace function reschedule_appointment(p_id uuid, p_new_start timestamptz)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_old appointments; v_new appointments; v_dur int; v_min int;
begin
  select a.* into v_old from appointments a
  join patients p on p.id = a.patient_id
  where a.id = p_id and a.status in ('scheduled','confirmed') and (p.guardian_user_id = auth.uid() or is_staff())
  for update of a;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  select min_cancel_hours into v_min from clinic_settings where clinic_id = v_old.clinic_id;
  if not is_staff() and v_old.starts_at < now() + make_interval(hours => v_min) then
    raise exception 'too_late' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from get_available_slots(v_old.clinic_id, v_old.doctor_id, v_old.type_id,
      (p_new_start at time zone 'America/Guatemala')::date, (p_new_start at time zone 'America/Guatemala')::date)
    where slot_start = p_new_start) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;
  select duration_min into v_dur from appointment_types where id = v_old.type_id;
  update appointments set status = 'rescheduled' where id = p_id;
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, source, created_by, rescheduled_from)
  values (v_old.clinic_id, v_old.doctor_id, v_old.patient_id, v_old.type_id, p_new_start,
          p_new_start + make_interval(mins => v_dur), case when is_staff() then 'doctor' else 'patient' end, auth.uid(), p_id)
  returning * into v_new;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id, diff)
  values (auth.uid(), case when is_staff() then 'doctor' else 'patient' end, 'reschedule', 'appointment', v_new.id,
          jsonb_build_object('from', p_id, 'old_start', v_old.starts_at, 'new_start', p_new_start));
  return v_new;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = 'P0001';
end $$;
grant execute on function reschedule_appointment(uuid,timestamptz) to authenticated;

-- Citas afectadas por un bloqueo (para el panel de impacto del doctor)
create or replace function appointments_affected_by(p_doctor uuid, p_clinic uuid, p_from timestamptz, p_to timestamptz)
returns setof appointments
language sql stable security definer set search_path = public as $$
  select a.* from appointments a
  where is_staff() and a.doctor_id = p_doctor and (p_clinic is null or a.clinic_id = p_clinic)
    and a.status in ('scheduled','confirmed')
    and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_from, p_to, '[)')
  order by a.starts_at
$$;
grant execute on function appointments_affected_by(uuid,uuid,timestamptz,timestamptz) to authenticated;

-- Recordatorios pendientes (solo service role)
create or replace function due_reminders()
returns table (appointment_id uuid)
language sql stable security definer set search_path = public as $$
  select a.id
  from appointments a
  join clinics c on c.id = a.clinic_id
  join clinic_settings s on s.clinic_id = a.clinic_id
  where a.status in ('scheduled','confirmed')
    and a.reminder_sent_at is null
    and (a.starts_at at time zone c.timezone)::date = ((now() at time zone c.timezone)::date + 1)
    and (now() at time zone c.timezone)::time >= s.reminder_local_time
$$;
revoke all on function due_reminders() from public, anon, authenticated;
```

```sql
-- 0004_cron.sql  (reemplazar <PROJECT_REF> y guardar el secreto en Vault)
select cron.schedule(
  'send-reminders', '*/15 * * * *',
  $$ select net.http_post(
       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
       headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
       body := '{}'::jsonb) $$
);
```

```sql
-- seed.sql (mínimo)
insert into appointment_types (name, duration_min, sort) values
  ('Primera consulta', 40, 1), ('Control', 20, 2), ('Colocación de aparatos', 60, 3), ('Retiro de aparatos', 60, 4), ('Urgencia', 20, 5);
```

## 9. Edge Functions

```ts
// supabase/functions/_shared/tokens.ts
export function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
export async function sha256hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function newToken() {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return { token, hash: await sha256hex(token) };
}
```

```ts
// supabase/functions/send-reminders/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { newToken } from "../_shared/tokens.ts";
import { renderReminder } from "../_shared/email.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_URL = Deno.env.get("APP_URL")!;

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });

  const { data: due, error } = await sb.rpc("due_reminders");
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const { appointment_id } of due ?? []) {
    const { data: a } = await sb.from("appointments")
      .select("id,status,starts_at,clinic:clinics(name,address,maps_url,whatsapp,timezone),type:appointment_types(name),patient:patients(full_name,guardian_user_id)")
      .eq("id", appointment_id).single();
    if (!a) continue;
    const { data: u } = await sb.auth.admin.getUserById(a.patient.guardian_user_id);
    const to = u?.user?.email;
    if (!to) continue;

    const expires = new Date(new Date(a.starts_at).getTime()).toISOString();
    const links: Record<string, string> = {};
    for (const purpose of ["confirm", "reschedule", "cancel"] as const) {
      const { token, hash } = await newToken();
      await sb.from("appointment_tokens").insert({ appointment_id, purpose, token_hash: hash, expires_at: expires });
      links[purpose] = `${APP_URL}/a/${token}`;
    }
    const { subject, html, text } = renderReminder({ appt: a, links });
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("MAIL_FROM"), to, subject, html, text }),
    });
    const body = await r.json().catch(() => ({}));
    await sb.from("notification_log").insert({ appointment_id, kind: "reminder_24h", to_email: to, provider_id: body.id ?? null, status: r.ok ? "sent" : "failed", error: r.ok ? null : JSON.stringify(body) });
    if (r.ok) { await sb.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appointment_id); sent++; }
  }
  return Response.json({ sent });
});
```

```ts
// supabase/functions/appointment-action/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sha256hex } from "../_shared/tokens.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": Deno.env.get("APP_URL")!, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS" };

async function lookup(token: string) {
  const hash = await sha256hex(token);
  const { data } = await sb.from("appointment_tokens")
    .select("id,purpose,expires_at,used_at,appointment:appointments(id,status,starts_at,clinic_id,type:appointment_types(name),clinic:clinics(name,address,maps_url),patient:patients(full_name))")
    .eq("token_hash", hash).maybeSingle();
  if (!data || data.used_at || new Date(data.expires_at) < new Date()) return null;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405, headers: cors });
  const { token, mode, new_start } = await req.json();

  const t = await lookup(token);
  if (!t) return Response.json({ ok: false, error: "invalid_or_expired" }, { status: 410, headers: cors });

  // mode: "peek" no muta; "execute" ejecuta el propósito del token
  if (mode === "peek") return Response.json({ ok: true, purpose: t.purpose, appointment: t.appointment }, { headers: cors });

  const id = t.appointment.id;
  if (t.purpose === "confirm") {
    await sb.from("appointments").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", id).eq("status", "scheduled");
  } else if (t.purpose === "cancel") {
    await sb.from("appointments").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: "cancelled_via_email" }).eq("id", id).in("status", ["scheduled", "confirmed"]);
  } else if (t.purpose === "reschedule") {
    if (!new_start) return Response.json({ ok: true, next: "choose_slot" }, { headers: cors });
    // Reprogramar: invocar lógica equivalente a reschedule_appointment con service role (ver nota en backlog E4-S3)
  }
  await sb.from("appointment_tokens").update({ used_at: new Date().toISOString() }).eq("id", t.id);
  await sb.from("audit_log").insert({ actor_type: "patient", action: `email_${t.purpose}`, entity: "appointment", entity_id: id });
  return Response.json({ ok: true, purpose: t.purpose }, { headers: cors });
});
```

```ts
// supabase/functions/_shared/email.ts
const fmt = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(new Date(iso));

export function renderReminder({ appt, links }: { appt: any; links: Record<string, string> }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const confirmed = appt.status === "confirmed";
  const subject = `Mañana tiene cita: ${when}`;
  const btn = (href: string, label: string, primary = false) =>
    `<a href="${href}" style="display:inline-block;min-height:48px;line-height:48px;padding:0 22px;margin:6px 6px 6px 0;border-radius:12px;font:600 16px/48px Arial,sans-serif;text-decoration:none;${primary ? "background:#0A6F6A;color:#FFFFFF;" : "background:#FFFFFF;color:#0A6F6A;border:2px solid #0A6F6A;line-height:44px;"}">${label}</a>`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F5F7F8;padding:24px;font:16px/1.5 Arial,sans-serif;color:#0E1B20">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px">
<p style="font-size:14px;color:#4A5A62;margin:0 0 8px">${appt.clinic.name}</p>
<h1 style="font-size:22px;margin:0 0 12px">Recordatorio de cita</h1>
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 4px">${appt.type.name}</p>
<p style="margin:0 0 16px;font-size:18px"><strong>${when}</strong></p>
<p style="margin:0 0 16px">${appt.clinic.address ?? ""}</p>
<p style="margin:0 0 8px">${confirmed ? "Su cita ya está confirmada. Si algo cambió, puede reprogramarla o cancelarla:" : "Por favor confirme su asistencia:"}</p>
<div>${confirmed ? "" : btn(links.confirm, "Confirmar mi cita", true)}${btn(links.reschedule, "Cambiar fecha u hora")}${btn(links.cancel, "Cancelar cita")}</div>
<p style="font-size:14px;color:#4A5A62;margin:20px 0 0">Si no puede usar los botones, escriba a la clínica${appt.clinic.whatsapp ? ` por WhatsApp: ${appt.clinic.whatsapp}` : ""}.</p>
</div></body></html>`;
  const text = [`${appt.clinic.name}`, `Recordatorio de cita`, `${appt.patient.full_name} — ${appt.type.name}`, when, appt.clinic.address ?? "",
    confirmed ? "" : `Confirmar: ${links.confirm}`, `Cambiar fecha u hora: ${links.reschedule}`, `Cancelar: ${links.cancel}`].filter(Boolean).join("\n");
  return { subject, html, text };
}
```

> Nota para la ruta `/a/:token`: (1) `peek` al cargar, mostrar la cita y **un botón** con la acción; (2) `execute` solo al presionar el botón (POST); (3) para `reschedule`, mostrar slots reales con `get_available_slots` mediante un endpoint de la misma Edge Function que valide el token (los slots no requieren sesión de usuario en este flujo) y ejecutar el cambio con la misma lógica que `reschedule_appointment` bajo service role.

## 10. Rutas y pantallas

| Ruta | Rol | Contenido clave |
|---|---|---|
| `/` | paciente | Próxima cita (card glass), atajos: reservar, mis citas, ayuda |
| `/ingresar` | público | Email → código/enlace; sin contraseña; pegar código permitido |
| `/citas` | paciente | Próximas / pasadas, agrupadas por paciente |
| `/citas/nueva` | paciente | Stepper: Paciente → Tipo y clínica → Fecha y hora → Confirmar |
| `/citas/:id` | paciente | Detalle, estado, acciones, mapa/Waze, .ics |
| `/a/:token` | público (token) | Aterrizaje de acción desde email |
| `/perfil` | paciente | Datos, dependientes, notificaciones, texto grande/contraste |
| `/ayuda` | todos | Contacto de la clínica (posición consistente en todas las pantallas) |
| `/admin` | doctor | **Hoy**: citas del día, confirmadas vs pendientes, siguiente paciente |
| `/admin/calendario` | doctor | Día (default móvil) · semana (≥768) · mes (puntos de densidad) |
| `/admin/citas/:id` | doctor | Detalle, mover/cancelar/marcar asistencia |
| `/admin/pacientes` | doctor | Lista y búsqueda |
| `/admin/horarios` | doctor | Franjas semanales por clínica, excepciones por fecha |
| `/admin/bloqueos` | doctor | Crear bloqueo + **panel de impacto** |
| `/admin/clinicas` | doctor | CRUD clínicas (UI MVP: una) |
| `/admin/ajustes` | doctor | Tipos de cita, reglas (anticipación, ventana, hora de recordatorio) |

## 11. Backlog MVP con criterios de aceptación

> **AC global (aplica a TODA historia de UI):** axe sin críticas/serias · operable solo con teclado · foco visible y no oculto por headers sticky · estados loading/empty/error · funciona a 320 px · reduced motion respetado · copy en `es.ts`.

### E0 — Fundaciones
- **E0-S1 Setup:** Vite+React+TS strict, Tailwind, React Aria, Motion, ESLint (jsx-a11y), Vitest, Playwright+axe, Lighthouse CI, Husky. *AC:* `pnpm lint && pnpm tsc --noEmit && pnpm test` pasan en CI; Lighthouse CI falla si a11y < 95 o LCP > 2.5 s (móvil emulado).
- **E0-S2 Tokens y primitivas:** `tokens.css`, `glass.css`, `Button`, `Field`, `Input`, `Dialog`, `Sheet`, `Badge`, `Toast`, `LiveRegion`, `GlassSurface`. *AC:* contraste de tokens verificado por test; `GlassSurface` cae a sólido con `prefers-reduced-transparency`; Storybook/página `/_ui` con estados hover/focus/disabled/error.
- **E0-S3 Supabase:** migraciones 0001–0004, seed, tipos generados. *AC:* `supabase db reset` limpio; advisors de seguridad sin hallazgos críticos; pruebas RLS (un tutor no ve pacientes/citas de otro).
- **E0-S4 PWA:** manifest, iconos, safe-areas iOS, instalable. *AC:* instalable en Android/iOS; sin overflow bajo notch; Lighthouse PWA OK.

### E1 — Autenticación y familia
- **E1-S1 Ingreso por OTP/enlace:** *AC:* email válido → código de 6 dígitos o enlace; campo permite pegar; rate limit; mensajes de error claros; sin CAPTCHA de reconocimiento; foco al campo de código al pasar de paso.
- **E1-S2 Perfil mínimo + consentimiento:** nombre, teléfono, aceptación de aviso de privacidad (texto provisto por la clínica). *AC:* no se piden datos redundantes (3.3.7); consentimiento guardado con fecha.
- **E1-S3 Cuenta familiar:** agregar/editar/eliminar (soft delete) pacientes; "soy yo" para adultos. *AC:* un tutor puede tener N pacientes; el selector de paciente aparece solo si N > 1 en el stepper.

### E2 — Reserva (paciente)
- **E2-S1 Stepper de 4 pasos:** *AC:* animación de pasos con `AnimatePresence`, `dir` según avance/retroceso; foco al encabezado del paso; botón "Atrás" siempre; progreso accesible (`aria-current="step"`); conserva selección al retroceder.
- **E2-S2 Selector de fecha/hora:** calendario React Aria + lista de slots del día. *AC:* días sin disponibilidad marcados con texto (no solo color); navegación con flechas/PgUp/PgDn; slots como botones ≥ 44 px; zona horaria mostrada; carga con skeleton.
- **E2-S3 Confirmación y comprobante:** llama `book_appointment`. *AC:* si `slot_unavailable` → mensaje "Ese horario acaba de ocuparse" + recarga de slots sin perder el contexto; éxito con resumen, botón .ics y link "Cómo llegar" (Waze/Google Maps); email de comprobante.
- **E2-S4 Reglas visibles:** *AC:* mostrar anticipación mínima de cancelación y ventana máxima; límite de reserva respetado por la función SQL.

### E3 — Mis citas (paciente)
- **E3-S1 Lista:** próximas/pasadas por paciente, estado con texto + icono. *AC:* empty state con CTA a reservar.
- **E3-S2 Detalle y acciones:** confirmar/reprogramar/cancelar con diálogo de confirmación. *AC:* `too_late` → mensaje + CTA a contactar la clínica (WhatsApp/teléfono); resultado anunciado por `aria-live`; sin arrastre (2.5.7).
- **E3-S3 Agregar al calendario:** `.ics` con zona `America/Guatemala`, `VALARM` -24 h. *AC:* abre correctamente en iOS/Android/Google.

### E4 — Recordatorios y acciones por email
- **E4-S1 Job de recordatorios:** `due_reminders` + `send-reminders` cada 15 min. *AC:* idempotente (índice único); respeta `reminder_local_time`; una cita sin email del tutor se registra como `failed` sin romper el lote; pruebas con citas a las 08:00 del lunes (recordatorio el domingo) y cruce de mes.
- **E4-S2 Email accesible:** HTML + texto plano; botones ≥ 44 px; contraste verificado; `lang="es"`. *AC:* revisión con subagente `copy-gt`; prueba en Gmail, Outlook y Apple Mail; SPF/DKIM/DMARC pasan.
- **E4-S3 Página `/a/:token`:** `peek` sin mutar + botón. *AC:* un GET (incluido pre-fetch de escáneres) nunca cambia estado; token caduca con la cita; token usado → mensaje claro y enlace a la app; reprogramar muestra slots reales y confirma con pantalla de resultado.
- **E4-S4 Comprobantes:** emails de confirmación/cancelación/reprogramación. *AC:* se registran en `notification_log`.

### E5 — Admin: horarios y clínicas
- **E5-S1 Clínica y ajustes:** nombre, dirección, `maps_url`, WhatsApp, reglas. *AC:* validación Zod; cambios auditados.
- **E5-S2 Horario semanal por clínica:** varias franjas por día (p. ej. 08:00–12:00 y 14:00–18:00). *AC:* no permite franjas superpuestas ni fin ≤ inicio; vista previa semanal; cambios no afectan citas ya creadas (aviso si las dejan fuera de horario).
- **E5-S3 Excepciones por fecha:** cerrar un día o cambiar horario de un día. *AC:* `get_available_slots` respeta la excepción (test SQL).
- **E5-S4 Multi-clínica en el schema:** 2 clínicas con horarios distintos en seed de prueba. *AC:* slots correctos por clínica; el doctor no puede tener citas simultáneas en dos clínicas (constraint por doctor).

### E6 — Admin: calendario y citas
- **E6-S1 Modo Hoy:** *AC:* lista del día con estado, hora, paciente, tipo; "siguiente paciente" destacado; actualiza al confirmar/cancelar.
- **E6-S2 Calendario día/semana/mes:** grid accesible (roles `grid/row/gridcell`, flechas, Home/End). *AC:* en móvil abre en día; semana ≥ 768 px; mes con puntos de densidad y detalle al seleccionar; cambio de vista sin perder fecha; sin drag-only.
- **E6-S3 Detalle y acciones:** mover/cancelar en nombre del paciente (con notificación), marcar `completed` / `no_show`. *AC:* acciones auditadas; `no_show` solo en citas pasadas.
- **E6-S4 Cita manual:** crear cita para un paciente existente o nuevo (llamada telefónica). *AC:* respeta el constraint; permite fuera de la ventana de anticipación (staff).

### E7 — Admin: bloqueos
- **E7-S1 Crear bloqueo (rango de fechas o franja parcial):** *AC:* conversión correcta a `timestamptz` por zona; todo-el-día y parcial; clínica específica o todas.
- **E7-S2 Panel de impacto:** antes de guardar, `appointments_affected_by` lista citas afectadas. *AC:* el doctor elige por cita "mover" o "cancelar"; al guardar, cada paciente recibe email con enlace a reprogramar (`time_off_notice`); ningún slot del bloqueo queda disponible tras guardar.
- **E7-S3 Editar/eliminar bloqueo:** *AC:* al eliminar, los slots vuelven a estar disponibles; auditado.

### E8 — Endurecimiento
- **E8-S1 Auditoría a11y manual:** teclado, 200 %/400 %, VoiceOver iOS, TalkBack, alto contraste forzado, reduced motion. *AC:* checklist firmada; 0 bloqueantes.
- **E8-S2 Rendimiento:** presupuesto de bundle y LCP; pruebas en Android de gama media. *AC:* JS inicial paciente ≤ 170 KB gzip; LCP p75 ≤ 2.5 s.
- **E8-S3 Seguridad:** revisión de RLS, rate limiting, headers, secretos. *AC:* `db-reviewer` sin hallazgos altos; sin PII en logs.
- **E8-S4 Declaración de accesibilidad y aviso de privacidad.**

## 12. Release 2 (no construir aún)
WhatsApp/SMS opt-in · "Próximo disponible" · lista de espera · segundo recordatorio · UI multi-clínica · feriados GT · plantillas de email editables · reporte de no-show/confirmación · feed iCal de solo lectura · indicaciones pre/post cita (contenido validado por el doctor) · guía de emergencias ortodónticas · CSAT de 1 pregunta · rol asistente.

## 13. Pruebas obligatorias

| Área | Casos mínimos |
|---|---|
| Slots (SQL) | día sin horario · excepción cerrada · excepción con horario distinto · bloqueo parcial · bloqueo que cruza medianoche · cita existente · buffer · min lead · max ventana · fin de mes · domingo |
| Concurrencia | dos reservas simultáneas del mismo slot → una falla con `slot_unavailable` |
| RLS | tutor A no ve pacientes/citas de tutor B · paciente no puede `update` directo en `appointments` · staff ve todo |
| Zona horaria | cita 23:30 local · recordatorio 10:00 local · bloqueo todo el día en UTC−6 · `.ics` |
| Tokens | caducado · usado · propósito incorrecto · GET no muta · cita ya cancelada |
| Email | render en texto plano · contraste · enlaces válidos |
| E2E | reserva completa · reprogramar desde email · cancelar tardío (`too_late`) · bloqueo con citas afectadas |
| A11y | axe por ruta y estado (loading/empty/error/éxito) · teclado · reduced motion · forced-colors |

## 14. Skills, MCP y agentes para Claude Code

**Skills a activar (ya disponibles en el entorno):**
`frontend-design` · `ui-ux-pro-max` · `ui-styling` · `design-system` · `hifi-ui-design-systems` · `framer-motion-guidelines` · `motion-design-microinteractions` · `design:accessibility-review` · `design:design-critique` · `design:ux-copy` · `design:design-handoff` · `implement-design` (si se diseña en Figma)

**MCP servers:** Supabase (migraciones, advisors, tipos) · Vercel (previews/logs) · Figma (opcional) · Playwright (E2E y a11y en navegador real, recomendado) · documentación actualizada (p. ej. Context7, recomendado)

**Subagentes (`.claude/agents/`):**

```markdown
---
name: a11y-auditor
description: Audita cambios de UI contra WCAG 2.2 AA. Usar proactivamente en cada PR de UI.
tools: Read, Grep, Glob, Bash
---
Revisa los archivos modificados. Verifica: contraste con tokens, nombre/rol/valor, orden de foco, foco no oculto (2.4.11), objetivos ≥ 44 px, alternativas a arrastre (2.5.7), ayuda consistente (3.2.6), entrada redundante (3.3.7), auth accesible (3.3.8), mensajes de estado con aria-live, reduced motion y forced-colors. Ejecuta `pnpm e2e --grep @a11y`. Reporta hallazgos con archivo:línea, criterio WCAG y arreglo propuesto.
```

```markdown
---
name: db-reviewer
description: Revisa migraciones SQL, RLS y funciones. Usar en cada migración.
tools: Read, Grep, Glob, Bash
---
Verifica: RLS habilitado en toda tabla nueva; ninguna política `using (true)` en datos de pacientes/citas; funciones `security definer` con `set search_path`; grants mínimos; el constraint `no_double_booking` intacto; índices para consultas por rango; ausencia de campos clínicos. Ejecuta `supabase db reset` y los tests SQL. Reporta riesgos por severidad.
```

```markdown
---
name: tz-reviewer
description: Detecta bugs de zona horaria en código y SQL.
tools: Read, Grep, Glob
---
Busca: `new Date(string)` sin zona, `toISOString().slice`, `getHours()` sobre fechas UTC, suposiciones de DST, comparaciones de fechas sin convertir a `America/Guatemala`, SQL con `::date` sobre `timestamptz` sin `at time zone`. Reporta con ejemplo y arreglo.
```

```markdown
---
name: copy-gt
description: Revisa microcopy y emails en español de Guatemala, trato "usted".
tools: Read, Grep, Glob
---
Revisa claridad, brevedad y tono cálido-profesional; sin jerga clínica innecesaria; mensajes de error con causa y siguiente paso; botones con verbo ("Confirmar mi cita"); consistencia de términos (cita, clínica, paciente). Todo string debe estar en `src/i18n/es.ts`.
```

**Slash commands (`.claude/commands/`):** `/new-migration <nombre>` (crea migración con RLS y checklist) · `/a11y-check <ruta>` (axe + checklist manual) · `/slot-test` (suite de casos límite del motor de slots).

**Hooks (`.claude/settings.json`):**

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [{ "type": "command", "command": "pnpm -s eslint --fix $CLAUDE_FILE_PATHS || true" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "pnpm -s tsc --noEmit" }] }
    ]
  }
}
```

## 15. Variables de entorno

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo Edge Functions
APP_URL=https://citas.<dominio>
RESEND_API_KEY=
MAIL_FROM="Clínica <citas@dominio>"
CRON_SECRET=
```

## 16. Guía breve de entrevistas (Fase 0)

**Tutores / pacientes (20 min):**
1. Cuéntame la última vez que agendaste o cambiaste una cita de ortodoncia. ¿Cómo fue?
2. ¿Qué canal usas más para organizarte (WhatsApp, correo, llamadas, calendario)? ¿Revisas el correo a diario?
3. ¿Alguna vez olvidaste o no pudiste asistir a una cita? ¿Qué pasó después?
4. ¿Qué tendría que pasar para que cambiaras una cita sin llamar?
5. ¿Desde qué dispositivo lo harías? ¿Con quién compartes la responsabilidad de las citas?
6. (Accesibilidad) ¿Usas zoom, texto grande o lector de pantalla? ¿Qué te estorba en apps de salud?

**Doctor / asistente (observación + 30 min):**
1. ¿Cómo se agenda hoy, paso a paso? ¿Qué se anota y dónde?
2. ¿Cuáles son los 3 problemas de agenda más frecuentes?
3. ¿Cómo manejan cancelaciones y reprogramaciones de último minuto?
4. ¿Qué pasa cuando el doctor se ausenta (viaje, congreso)?
5. ¿Qué datos del historial pueden exportarse para calcular no-show y horas pico?

## 17. Preguntas abiertas

**P1 — Bloquean diseño/desarrollo**
1. ¿Pacientes activos y citas por semana? ¿No-show actual aproximado?
2. ¿Quién agenda hoy y con qué herramienta?
3. ¿Tipos de cita y duraciones reales?
4. ¿Horario real de la clínica actual y fechas/horarios de clínicas futuras?
5. ¿Política de cancelación (anticipación, cargos)?
6. ¿Qué hacer con citas no confirmadas (solo avisar o liberar cupo)?
7. ¿Los tutores/pacientes tienen email registrado hoy?
8. ¿Se aceptan pacientes nuevos desde la app o solo existentes?

**P2 — Contenido y marca**
1. Nombre de la clínica, logo, colores, fotos; ¿usted o tú?
2. Dominio y remitente de correo.
3. Indicaciones pre/post cita validadas por el doctor.
4. Feriados y días no laborables.

**P3 — Alcance y tiempos**
1. ¿WhatsApp/SMS y presupuesto mensual?
2. ¿Software clínico existente con el que integrar a futuro?
3. ¿Fecha objetivo del piloto?

## 18. Orden de trabajo recomendado para Claude Code

1. Leer este archivo y `CLAUDE.md`; crear la estructura y el setup (E0-S1).
2. Tokens y primitivas con su página de pruebas (E0-S2); pasar `a11y-auditor`.
3. Migraciones y tests SQL de slots, RLS y concurrencia **antes** de construir UI (E0-S3).
4. Flujo de reserva (E1 → E2 → E3).
5. Admin: horarios → calendario → bloqueos con panel de impacto (E5 → E6 → E7).
6. Recordatorios y página `/a/:token` (E4).
7. Endurecimiento (E8) y piloto.

> En cada paso: tipos limpios, tests verdes, axe sin violaciones y revisión del subagente correspondiente antes de pasar al siguiente.
