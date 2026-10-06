-- is_staff(): doctor o asistente — operación (pacientes, citas).
-- is_doctor(): solo doctor — configuración (clínica, horarios, tipos, bloqueos).
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid())
$$;

create or replace function is_doctor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and role = 'doctor')
$$;

alter table clinics enable row level security;
alter table staff enable row level security;
alter table clinic_staff enable row level security;
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
create policy clinic_staff_read on clinic_staff for select to authenticated using (true);
create policy types_read on appointment_types for select to authenticated using (is_active);
create policy settings_read on clinic_settings for select to authenticated using (true);

-- Configuración: solo doctor (el asistente opera agenda, no la define)
create policy clinics_doctor on clinics for all to authenticated using (is_doctor()) with check (is_doctor());
create policy settings_doctor on clinic_settings for all to authenticated using (is_doctor()) with check (is_doctor());
create policy hours_doctor on clinic_hours for all to authenticated using (is_doctor()) with check (is_doctor());
create policy hours_read on clinic_hours for select to authenticated using (true);
create policy exceptions_doctor on schedule_exceptions for all to authenticated using (is_doctor()) with check (is_doctor());
create policy exceptions_read on schedule_exceptions for select to authenticated using (true);
create policy timeoff_doctor on time_off for all to authenticated using (is_doctor()) with check (is_doctor());
create policy types_doctor on appointment_types for all to authenticated using (is_doctor()) with check (is_doctor());
create policy clinic_staff_doctor on clinic_staff for all to authenticated using (is_doctor()) with check (is_doctor());

-- Staff: cada quien ve su propia fila; solo un doctor da de alta/edita staff
create policy staff_self_read on staff for select to authenticated using (user_id = auth.uid());
create policy staff_doctor_manage on staff for all to authenticated using (is_doctor()) with check (is_doctor());

-- Perfiles
create policy profiles_self on profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_staff_read on profiles for select to authenticated using (is_staff());

-- Pacientes: el tutor gestiona los suyos; staff gestiona cualquiera
-- (incluye pacientes invitados sin guardian_user_id, creados por staff).
create policy patients_guardian on patients for all to authenticated
  using (guardian_user_id = auth.uid()) with check (guardian_user_id = auth.uid());
create policy patients_staff on patients for all to authenticated using (is_staff()) with check (is_staff());

-- Citas: tutor solo lee las suyas; toda escritura del paciente va por RPC; staff total
create policy appts_guardian_read on appointments for select to authenticated
  using (patient_id in (select id from patients where guardian_user_id = auth.uid()));
create policy appts_staff on appointments for all to authenticated using (is_staff()) with check (is_staff());

-- Tokens, notificaciones y auditoría: solo service role (sin políticas para authenticated)
create policy audit_staff_read on audit_log for select to authenticated using (is_staff());
create policy notif_staff_read on notification_log for select to authenticated using (is_staff());
