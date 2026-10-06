-- Respuesta a los advisors de seguridad/rendimiento tras 0001-0004.

-- 1) Postgres otorga EXECUTE a PUBLIC por defecto al crear una función.
-- Los `grant ... to authenticated` de 0002/0003 eran aditivos: `anon`
-- seguía teniendo acceso vía el grant implícito a PUBLIC. Se revoca
-- explícitamente de PUBLIC (que cubre anon) en todas las funciones
-- expuestas por PostgREST.
revoke execute on function is_staff() from public;
revoke execute on function is_doctor() from public;
revoke execute on function get_available_slots(uuid,uuid,uuid,date,date) from public;
revoke execute on function book_appointment(uuid,uuid,uuid,uuid,timestamptz) from public;
revoke execute on function cancel_appointment(uuid,text) from public;
revoke execute on function confirm_appointment(uuid) from public;
revoke execute on function reschedule_appointment(uuid,timestamptz) from public;
revoke execute on function appointments_affected_by(uuid,uuid,timestamptz,timestamptz) from public;
revoke execute on function claimable_guest_patients() from public;
revoke execute on function claim_patients(uuid[]) from public;

-- 2) search_path mutable en funciones de trigger (no eran security definer,
-- pero igual deben fijar search_path por higiene y para que el linter de
-- seguridad quede limpio).
create or replace function touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create or replace function assert_doctor_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from staff where id = new.doctor_id and role = 'doctor') then
    raise exception 'doctor_id % no corresponde a un miembro de staff con role=doctor', new.doctor_id
      using errcode = '23514';
  end if;
  return new;
end $$;

-- 3) btree_gist en schema public -> extensions (schema estándar de Supabase).
alter extension btree_gist set schema extensions;

-- 4) auth.uid() se reevaluaba por fila en 4 políticas; (select auth.uid())
-- se evalúa una sola vez por consulta (initplan).
drop policy staff_self_read on staff;
create policy staff_self_read on staff for select to authenticated using (user_id = (select auth.uid()));

drop policy profiles_self on profiles;
create policy profiles_self on profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy patients_guardian on patients;
create policy patients_guardian on patients for all to authenticated
  using (guardian_user_id = (select auth.uid())) with check (guardian_user_id = (select auth.uid()));

drop policy appts_guardian_read on appointments;
create policy appts_guardian_read on appointments for select to authenticated
  using (patient_id in (select id from patients where guardian_user_id = (select auth.uid())));

-- 5) Índices faltantes en FKs usadas en joins/filtros frecuentes.
create index if not exists appointments_created_by_idx on appointments (created_by);
create index if not exists appointments_rescheduled_from_idx on appointments (rescheduled_from);
create index if not exists appointments_type_id_idx on appointments (type_id);
create index if not exists clinic_hours_doctor_id_idx on clinic_hours (doctor_id);
create index if not exists clinic_staff_staff_id_idx on clinic_staff (staff_id);
create index if not exists schedule_exceptions_doctor_id_idx on schedule_exceptions (doctor_id);
create index if not exists time_off_clinic_id_idx on time_off (clinic_id);

-- 6) Políticas redundantes en catálogos: `_read` (todo autenticado) y
-- `_doctor` (`for all`) competían por el mismo SELECT. Se acota `_doctor`
-- a escritura — el SELECT ya lo cubre `_read` sin duplicar evaluación.
-- (patients/profiles/appointments/staff NO se tocan: ahí el solape es un
-- OR semánticamente real —dueño vs. staff—, no redundancia.)
drop policy clinics_doctor on clinics;
create policy clinics_doctor_write on clinics for insert to authenticated with check (is_doctor());
create policy clinics_doctor_update on clinics for update to authenticated using (is_doctor()) with check (is_doctor());
create policy clinics_doctor_delete on clinics for delete to authenticated using (is_doctor());

drop policy settings_doctor on clinic_settings;
create policy settings_doctor_write on clinic_settings for insert to authenticated with check (is_doctor());
create policy settings_doctor_update on clinic_settings for update to authenticated using (is_doctor()) with check (is_doctor());
create policy settings_doctor_delete on clinic_settings for delete to authenticated using (is_doctor());

drop policy hours_doctor on clinic_hours;
create policy hours_doctor_write on clinic_hours for insert to authenticated with check (is_doctor());
create policy hours_doctor_update on clinic_hours for update to authenticated using (is_doctor()) with check (is_doctor());
create policy hours_doctor_delete on clinic_hours for delete to authenticated using (is_doctor());

drop policy exceptions_doctor on schedule_exceptions;
create policy exceptions_doctor_write on schedule_exceptions for insert to authenticated with check (is_doctor());
create policy exceptions_doctor_update on schedule_exceptions for update to authenticated using (is_doctor()) with check (is_doctor());
create policy exceptions_doctor_delete on schedule_exceptions for delete to authenticated using (is_doctor());

drop policy types_doctor on appointment_types;
create policy types_doctor_write on appointment_types for insert to authenticated with check (is_doctor());
create policy types_doctor_update on appointment_types for update to authenticated using (is_doctor()) with check (is_doctor());
create policy types_doctor_delete on appointment_types for delete to authenticated using (is_doctor());

drop policy clinic_staff_doctor on clinic_staff;
create policy clinic_staff_doctor_write on clinic_staff for insert to authenticated with check (is_doctor());
create policy clinic_staff_doctor_update on clinic_staff for update to authenticated using (is_doctor()) with check (is_doctor());
create policy clinic_staff_doctor_delete on clinic_staff for delete to authenticated using (is_doctor());
