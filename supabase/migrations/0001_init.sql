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

-- Identidad de cualquiera con acceso a /admin. "doctor" tiene acceso de
-- configuración (is_doctor()); "assistant" solo opera agenda/pacientes
-- (is_staff()). Se separa de la noción de "clínico con citas" mediante el
-- trigger assert_doctor_role más abajo: un asistente nunca puede ser el
-- doctor_id de una cita, franja u horario.
create table staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  role text not null check (role in ('doctor','assistant')),
  full_name text not null,
  created_at timestamptz not null default now()
);

create table clinic_staff (
  clinic_id uuid not null references clinics(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  primary key (clinic_id, staff_id)
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
  doctor_id uuid not null references staff(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1=lunes … 7=domingo
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index on clinic_hours (clinic_id, doctor_id, weekday);

create table schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  doctor_id uuid not null references staff(id) on delete cascade,
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
  doctor_id uuid not null references staff(id) on delete cascade,
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

-- guardian_user_id es NULLABLE: paciente "invitado" creado por staff desde
-- una llamada telefónica, sin cuenta ni email todavía. contact_email
-- permite registrar un correo sin forzar que el paciente inicie sesión;
-- si luego un tutor hace login OTP con ese mismo correo, puede "reclamar"
-- el paciente vía claim_patients() (ver 0003), nunca automático/silencioso.
create table patients (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid references auth.users(id) on delete restrict,
  contact_email text,
  full_name text not null,
  birth_date date,
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on patients (guardian_user_id);
create index on patients (lower(contact_email)) where contact_email is not null;

create table appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  doctor_id uuid not null references staff(id),
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
-- Soporta auto_confirm_due_appointments() (0003): barrido frecuente de
-- citas 'scheduled' próximas a la ventana de 12h.
create index on appointments (starts_at) where status = 'scheduled';

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
  to_email text,
  provider_id text,
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
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

-- Integridad: un asistente nunca puede quedar como "el doctor" de una
-- franja/excepción/bloqueo/cita — solo filas de staff con role='doctor'.
create or replace function assert_doctor_role() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from staff where id = new.doctor_id and role = 'doctor') then
    raise exception 'doctor_id % no corresponde a un miembro de staff con role=doctor', new.doctor_id
      using errcode = '23514';
  end if;
  return new;
end $$;
create trigger clinic_hours_doctor_role before insert or update of doctor_id on clinic_hours for each row execute function assert_doctor_role();
create trigger schedule_exceptions_doctor_role before insert or update of doctor_id on schedule_exceptions for each row execute function assert_doctor_role();
create trigger time_off_doctor_role before insert or update of doctor_id on time_off for each row execute function assert_doctor_role();
create trigger appointments_doctor_role before insert or update of doctor_id on appointments for each row execute function assert_doctor_role();
