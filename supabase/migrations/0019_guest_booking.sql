-- E9: reservar sin login ni OTP. Mismo patrón que token_confirm/cancel/
-- reschedule_appointment (0015_token_actions.sql): security definer,
-- revocada de public/anon/authenticated, otorgada solo a service_role.
-- Quien la llama es la Edge Function guest-booking con el service role —
-- no hay auth.uid() que validar, por eso no reutilizamos book_appointment
-- (esa exige patients.guardian_user_id = auth.uid()).
--
-- Antiabuso: límite de 3 citas scheduled/confirmed por contact_email
-- en 24h. pg_advisory_xact_lock serializa llamadas concurrentes con el
-- mismo correo (se libera solo al terminar la transacción) para que el
-- count(*) de abajo no pueda leerse "limpio" dos veces en paralelo y
-- dejar pasar más de 3 — sin este lock, dos llamadas simultáneas con
-- el mismo correo podrían ambas ver v_recent < 3 antes de que
-- cualquiera haga commit (hallazgo de db-reviewer). El honeypot que
-- atrapa bots simples vive en la Edge Function, no aquí.
create or replace function guest_book_appointment(
  p_full_name text, p_contact_email text,
  p_type uuid, p_clinic uuid, p_doctor uuid, p_start timestamptz
) returns appointments
language plpgsql security definer set search_path = public as $$
declare v_dur int; v_row appointments; v_patient uuid; v_recent int;
begin
  if p_full_name is null or length(trim(p_full_name)) = 0
     or p_contact_email is null or p_contact_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(lower(trim(p_contact_email))));

  select count(*) into v_recent from appointments a join patients p on p.id = a.patient_id
    where lower(p.contact_email) = lower(p_contact_email)
      and a.status in ('scheduled','confirmed') and a.created_at > now() - interval '24 hours';
  if v_recent >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from get_available_slots(p_clinic, p_doctor, p_type,
      (p_start at time zone 'America/Guatemala')::date, (p_start at time zone 'America/Guatemala')::date)
    where slot_start = p_start) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;

  select duration_min into v_dur from appointment_types where id = p_type and bookable_online and is_active;
  if v_dur is null then raise exception 'invalid_input' using errcode = 'P0001'; end if;

  insert into patients (full_name, contact_email, guardian_user_id)
  values (trim(p_full_name), lower(trim(p_contact_email)), null)
  returning id into v_patient;

  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, source)
  values (p_clinic, p_doctor, v_patient, p_type, p_start, p_start + make_interval(mins => v_dur), 'patient')
  returning * into v_row;

  insert into audit_log (actor_type, action, entity, entity_id, diff)
  values ('patient', 'book', 'appointment', v_row.id, jsonb_build_object('via', 'guest'));
  return v_row;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = 'P0001';
end $$;
revoke all on function guest_book_appointment(text,text,uuid,uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function guest_book_appointment(text,text,uuid,uuid,uuid,timestamptz) to service_role;
