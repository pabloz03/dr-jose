-- Suite de verificación E0-S3: slots, RLS y concurrencia.
-- Corre entero en UNA transacción con ROLLBACK al final — no deja rastro
-- en el proyecto. Pensado para ejecutarse vía execute_sql (rol con
-- bypassrls) alternando `set local role authenticated` + `request.jwt.claims`
-- para simular usuarios reales bajo RLS.
begin;

create temporary table test_results (
  id serial primary key,
  suite text not null,
  name text not null,
  passed boolean not null,
  detail text
);

create or replace function pg_temp.assert_true(p_suite text, p_name text, p_condition boolean, p_detail text default null)
returns void language plpgsql security definer as $$
begin
  insert into test_results (suite, name, passed, detail) values (p_suite, p_name, coalesce(p_condition, false), p_detail);
end $$;

-- ========================================================================
-- Fixtures (como rol privilegiado, bypassrls)
-- ========================================================================
do $$
declare
  v_clinic uuid := '99999999-9999-9999-9999-999999999001';
  v_doctor_user uuid := '11111111-1111-1111-1111-111111111111';
  v_doctor_staff uuid;
  v_assistant_user uuid := '11111111-1111-1111-1111-111111111112';
  v_assistant_staff uuid;
  v_tutor_a uuid := '22222222-2222-2222-2222-222222222221';
  v_tutor_b uuid := '22222222-2222-2222-2222-222222222222';
  v_patient_a uuid;
  v_patient_b uuid;
  v_guest_email text := 'guest.claim.test@example.com';
  v_guest_patient uuid;
  v_type_basic uuid;
  v_type_buffer uuid;
  v_monday date;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_doctor_user, '00000000-0000-0000-0000-000000000000', 'authenticated','authenticated','doctor.e0s3@example.com','','now()'::timestamptz,'{}'::jsonb,'{}'::jsonb, now(), now()),
    (v_assistant_user, '00000000-0000-0000-0000-000000000000', 'authenticated','authenticated','assistant.e0s3@example.com','','now()'::timestamptz,'{}'::jsonb,'{}'::jsonb, now(), now()),
    (v_tutor_a, '00000000-0000-0000-0000-000000000000', 'authenticated','authenticated','tutor.a.e0s3@example.com','','now()'::timestamptz,'{}'::jsonb,'{}'::jsonb, now(), now()),
    (v_tutor_b, '00000000-0000-0000-0000-000000000000', 'authenticated','authenticated','tutor.b.e0s3@example.com','','now()'::timestamptz,'{}'::jsonb,'{}'::jsonb, now(), now()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated','authenticated', v_guest_email,'','now()'::timestamptz,'{}'::jsonb,'{}'::jsonb, now(), now());

  insert into clinics (id, name, timezone) values (v_clinic, 'Clínica de prueba E0-S3', 'America/Guatemala');
  insert into clinic_settings (clinic_id, min_cancel_hours, min_lead_hours, max_booking_days, slot_step_min)
  values (v_clinic, 24, 2, 90, 30);

  insert into staff (user_id, role, full_name) values (v_doctor_user, 'doctor', 'Dra. Prueba') returning id into v_doctor_staff;
  insert into staff (user_id, role, full_name) values (v_assistant_user, 'assistant', 'Asistente Prueba') returning id into v_assistant_staff;
  insert into clinic_staff (clinic_id, staff_id) values (v_clinic, v_doctor_staff), (v_clinic, v_assistant_staff);

  insert into appointment_types (name, duration_min, buffer_after_min) values ('Tipo prueba 30min', 30, 0) returning id into v_type_basic;
  insert into appointment_types (name, duration_min, buffer_after_min) values ('Tipo prueba con buffer', 30, 15) returning id into v_type_buffer;

  -- Ancla: el lunes de una semana 14 días adelante (evita flakiness por "hoy").
  v_monday := (current_date + 14) - ((extract(isodow from current_date + 14)::int) - 1);

  -- Horario normal lun-sáb 09:00-12:00 (domingo = v_monday+6 queda SIN horario a propósito).
  insert into clinic_hours (clinic_id, doctor_id, weekday, start_time, end_time)
  select v_clinic, v_doctor_staff, w, '09:00', '12:00' from generate_series(1,6) as w;
  -- Franja extra el jueves por la noche, para probar bloqueo que cruza medianoche.
  insert into clinic_hours (clinic_id, doctor_id, weekday, start_time, end_time)
  values (v_clinic, v_doctor_staff, 4, '20:00', '23:30');

  -- Excepción: martes cerrado.
  insert into schedule_exceptions (clinic_id, doctor_id, on_date, is_closed)
  values (v_clinic, v_doctor_staff, v_monday + 1, true);
  -- Excepción: miércoles con horario distinto (tarde en vez de mañana).
  insert into schedule_exceptions (clinic_id, doctor_id, on_date, is_closed, start_time, end_time)
  values (v_clinic, v_doctor_staff, v_monday + 2, false, '14:00', '16:00');

  -- Bloqueo parcial el lunes 10:00-11:00 local (UTC-6 => 16:00-17:00 UTC).
  insert into time_off (doctor_id, clinic_id, starts_at, ends_at, reason)
  values (v_doctor_staff, v_clinic, (v_monday::timestamp + time '10:00') at time zone 'America/Guatemala',
          (v_monday::timestamp + time '11:00') at time zone 'America/Guatemala', 'bloqueo parcial de prueba');
  -- Bloqueo que cruza medianoche: jueves 23:00 a viernes 01:00 local.
  insert into time_off (doctor_id, clinic_id, starts_at, ends_at, reason)
  values (v_doctor_staff, v_clinic, ((v_monday + 3)::timestamp + time '23:00') at time zone 'America/Guatemala',
          ((v_monday + 4)::timestamp + time '01:00') at time zone 'America/Guatemala', 'bloqueo cruza medianoche');

  -- Pacientes: tutor A y B, más uno "invitado" (sin cuenta, con contact_email).
  insert into patients (guardian_user_id, full_name, is_self) values (v_tutor_a, 'Paciente de A', true) returning id into v_patient_a;
  insert into patients (guardian_user_id, full_name, is_self) values (v_tutor_b, 'Paciente de B', true) returning id into v_patient_b;
  insert into patients (guardian_user_id, contact_email, full_name) values (null, v_guest_email, 'Paciente invitado') returning id into v_guest_patient;

  -- Cita existente el lunes 09:00 (para probar exclusión por cita + buffer).
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, status, source, created_by)
  values (v_clinic, v_doctor_staff, v_patient_a, v_type_buffer,
          (v_monday::timestamp + time '09:00') at time zone 'America/Guatemala',
          (v_monday::timestamp + time '09:30') at time zone 'America/Guatemala',
          'confirmed', 'doctor', v_doctor_user);

  -- Guarda el ancla en una GUC de sesión para reusarla fuera de este bloque.
  perform set_config('test.clinic', v_clinic::text, false);
  perform set_config('test.doctor_staff', v_doctor_staff::text, false);
  perform set_config('test.doctor_user', v_doctor_user::text, false);
  perform set_config('test.assistant_staff', v_assistant_staff::text, false);
  perform set_config('test.assistant_user', v_assistant_user::text, false);
  perform set_config('test.tutor_a', v_tutor_a::text, false);
  perform set_config('test.tutor_b', v_tutor_b::text, false);
  perform set_config('test.patient_a', v_patient_a::text, false);
  perform set_config('test.patient_b', v_patient_b::text, false);
  perform set_config('test.guest_patient', v_guest_patient::text, false);
  perform set_config('test.guest_email', v_guest_email, false);
  perform set_config('test.type_basic', v_type_basic::text, false);
  perform set_config('test.type_buffer', v_type_buffer::text, false);
  perform set_config('test.monday', v_monday::text, false);
end $$;

-- ========================================================================
-- SLOTS: casos límite (§13 del handoff)
-- ========================================================================
do $$
declare
  v_clinic uuid := current_setting('test.clinic')::uuid;
  v_doctor uuid := current_setting('test.doctor_staff')::uuid;
  v_type uuid := current_setting('test.type_basic')::uuid;
  v_type_buf uuid := current_setting('test.type_buffer')::uuid;
  v_monday date := current_setting('test.monday')::date;
  v_count int;
  v_has_2300 boolean;
begin
  -- Domingo (v_monday+6): día sin horario -> 0 slots.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 6, v_monday + 6);
  perform pg_temp.assert_true('slots', 'domingo sin horario da 0 slots', v_count = 0, 'count=' || v_count);

  -- Martes (v_monday+1): excepción cerrada -> 0 slots pese a tener horario base.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 1, v_monday + 1);
  perform pg_temp.assert_true('slots', 'excepción cerrada da 0 slots', v_count = 0, 'count=' || v_count);

  -- Miércoles (v_monday+2): excepción con horario 14:00-16:00 (no 09-12) -> todos los slots caen ahí.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 2, v_monday + 2)
    where slot_start < ((v_monday + 2)::timestamp + time '14:00') at time zone 'America/Guatemala'
       or slot_start >= ((v_monday + 2)::timestamp + time '16:00') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'excepción con horario distinto: todos los slots caen en 14-16h', v_count = 0, 'fuera de rango=' || v_count);

  -- Lunes: bloqueo parcial 10:00-11:00 -> no debe existir slot que empiece en ese rango.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday, v_monday)
    where slot_start >= (v_monday::timestamp + time '10:00') at time zone 'America/Guatemala'
      and slot_start < (v_monday::timestamp + time '11:00') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'bloqueo parcial excluye 10:00-11:00', v_count = 0, 'slots dentro del bloqueo=' || v_count);

  -- Lunes: cita existente 09:00-09:30 -> 09:00 no debe estar disponible.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday, v_monday)
    where slot_start = (v_monday::timestamp + time '09:00') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'cita existente excluye su propio horario', v_count = 0, 'coincidencias=' || v_count);

  -- Buffer: una cita de 09:00-09:30 con buffer_after_min=15 extiende su zona
  -- bloqueada hasta 09:45 -> el slot de 09:30 (tipo básico) debe excluirse,
  -- mientras que 10:00 sigue libre. Se usa el sábado (v_monday+5), vacío.
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, status, source, created_by)
  values (v_clinic, v_doctor, (select current_setting('test.patient_a'))::uuid, v_type_buf,
          ((v_monday + 5)::timestamp + time '09:00') at time zone 'America/Guatemala',
          ((v_monday + 5)::timestamp + time '09:30') at time zone 'America/Guatemala',
          'confirmed', 'doctor', null);

  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 5, v_monday + 5)
    where slot_start = ((v_monday + 5)::timestamp + time '09:30') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'buffer_after_min de una cita excluye el slot inmediatamente después', v_count = 0, 'coincidencias=' || v_count);

  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 5, v_monday + 5)
    where slot_start = ((v_monday + 5)::timestamp + time '10:00') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'buffer_after_min no excluye slots fuera de su alcance (10:00 libre)', v_count = 1, 'coincidencias=' || v_count);

  -- Jueves nocturno: bloqueo 23:00(jue)-01:00(vie) excluye el slot de 23:00 pero no los previos.
  select bool_or(slot_start = ((v_monday + 3)::timestamp + time '23:00') at time zone 'America/Guatemala')
    into v_has_2300
    from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 3, v_monday + 3);
  perform pg_temp.assert_true('slots', 'bloqueo cruza medianoche excluye el slot de 23:00', not coalesce(v_has_2300, false), 'presente=' || v_has_2300);

  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday + 3, v_monday + 3)
    where slot_start >= ((v_monday + 3)::timestamp + time '20:00') at time zone 'America/Guatemala'
      and slot_start < ((v_monday + 3)::timestamp + time '23:00') at time zone 'America/Guatemala';
  perform pg_temp.assert_true('slots', 'bloqueo cruza medianoche no afecta slots previos (20:00-22:30)', v_count = 6, 'count=' || v_count);

  -- Ventana máxima (90 días): no debe haber slots más allá de hoy+90 (hora clínica).
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, v_monday, v_monday + 120)
    where (slot_start at time zone 'America/Guatemala')::date > (now() at time zone 'America/Guatemala')::date + 90;
  perform pg_temp.assert_true('slots', 'ventana máxima de 90 días se respeta', v_count = 0, 'fuera de ventana=' || v_count);

  -- Antelación mínima: ningún slot de "hoy" debe estar antes de now()+2h.
  select count(*) into v_count from get_available_slots(v_clinic, v_doctor, v_type, current_date, current_date)
    where slot_start < now() + interval '2 hours';
  perform pg_temp.assert_true('slots', 'antelación mínima (min_lead_hours) se respeta', v_count = 0, 'antes de lead time=' || v_count);

  -- Fin de mes: no debe reventar al cruzar límite de mes.
  perform 1 from get_available_slots(v_clinic, v_doctor, v_type, (date_trunc('month', v_monday) + interval '1 month' - interval '1 day')::date, (date_trunc('month', v_monday) + interval '1 month')::date);
  perform pg_temp.assert_true('slots', 'consulta que cruza fin de mes no falla', true);
end $$;

-- ========================================================================
-- CONCURRENCIA: exclusion constraint
-- ========================================================================
do $$
declare
  v_clinic uuid := current_setting('test.clinic')::uuid;
  v_doctor uuid := current_setting('test.doctor_staff')::uuid;
  v_patient uuid := current_setting('test.patient_a')::uuid;
  v_type uuid := current_setting('test.type_basic')::uuid;
  v_monday date := current_setting('test.monday')::date;
  v_slot timestamptz := (v_monday::timestamp + time '10:30') at time zone 'America/Guatemala';
  v_caught boolean := false;
begin
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, status, source, created_by)
  values (v_clinic, v_doctor, v_patient, v_type, v_slot, v_slot + interval '30 minutes', 'confirmed', 'doctor', null);

  begin
    insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, status, source, created_by)
    values (v_clinic, v_doctor, v_patient, v_type, v_slot, v_slot + interval '30 minutes', 'confirmed', 'doctor', null);
  exception when exclusion_violation then
    v_caught := true;
  end;
  perform pg_temp.assert_true('concurrency', 'exclusion constraint impide doble reserva del mismo slot', v_caught);
end $$;

-- ========================================================================
-- RLS
-- ========================================================================

-- Tutor A: no debe ver pacientes de B.
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.tutor_a'))::text, true);
set local role authenticated;
select pg_temp.assert_true('rls', 'tutor A no ve pacientes de tutor B',
  not exists (select 1 from patients where id = current_setting('test.patient_b')::uuid));
select pg_temp.assert_true('rls', 'tutor A sí ve su propio paciente',
  exists (select 1 from patients where id = current_setting('test.patient_a')::uuid));
select pg_temp.assert_true('rls', 'tutor A no ve el paciente invitado (sin reclamar)',
  not exists (select 1 from patients where id = current_setting('test.guest_patient')::uuid));
-- Paciente no puede hacer UPDATE directo en appointments (solo vía RPC).
do $$
declare v_updated int;
begin
  update appointments set status = 'cancelled' where patient_id = current_setting('test.patient_a')::uuid;
  get diagnostics v_updated = row_count;
  perform pg_temp.assert_true('rls', 'tutor no puede UPDATE directo en appointments', v_updated = 0, 'filas afectadas=' || v_updated);
end $$;
reset role;

-- Tutor B: no debe ver pacientes de A.
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.tutor_b'))::text, true);
set local role authenticated;
select pg_temp.assert_true('rls', 'tutor B no ve pacientes de tutor A',
  not exists (select 1 from patients where id = current_setting('test.patient_a')::uuid));
reset role;

-- Asistente: ve pacientes/citas (is_staff) pero NO puede tocar configuración (is_doctor).
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.assistant_user'))::text, true);
set local role authenticated;
select pg_temp.assert_true('rls', 'asistente (is_staff) ve pacientes de cualquier tutor',
  exists (select 1 from patients where id = current_setting('test.patient_a')::uuid)
  and exists (select 1 from patients where id = current_setting('test.patient_b')::uuid));
do $$
declare v_inserted boolean := true;
begin
  begin
    insert into appointment_types (name, duration_min) values ('No debería poder crear esto', 10);
  exception when insufficient_privilege or others then
    v_inserted := false;
  end;
  perform pg_temp.assert_true('rls', 'asistente NO puede crear appointment_types (solo doctor)', not v_inserted);
end $$;
reset role;

-- Doctor: sí puede crear appointment_types (is_doctor).
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.doctor_user'))::text, true);
set local role authenticated;
do $$
declare v_ok boolean := true;
begin
  begin
    insert into appointment_types (name, duration_min) values ('Tipo creado por doctor en test', 15);
  exception when others then
    v_ok := false;
  end;
  perform pg_temp.assert_true('rls', 'doctor (is_doctor) sí puede crear appointment_types', v_ok);
end $$;
reset role;

-- ========================================================================
-- Reporte final
-- ========================================================================
select suite, name, passed, detail from test_results order by passed asc, suite, id;
select count(*) filter (where not passed) as failed, count(*) as total from test_results;

rollback;
