-- E4-S3: confirmar/cancelar/reprogramar desde el enlace de correo (sin
-- sesión de usuario). No reutilizamos confirm_appointment/cancel_appointment/
-- reschedule_appointment porque esas exigen auth.uid() = dueño del
-- paciente o is_staff() — aquí quien actúa es la Edge Function con
-- service role en nombre del paciente, validado por el token (ya
-- verificado por appointment-action antes de llamar a estas funciones).
-- Mismo patrón de grants que due_reminders: se revoca de public/anon/
-- authenticated y no se otorga a nadie explícitamente — en Supabase,
-- service_role ya tiene EXECUTE por privilegios por defecto del esquema
-- public, igual que due_reminders que ya funciona así.

create or replace function token_confirm_appointment(p_id uuid)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  update appointments set status = 'confirmed', confirmed_at = now()
  where id = p_id and status = 'scheduled'
  returning * into v_row;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  insert into audit_log (actor_type, action, entity, entity_id, diff)
  values ('patient', 'confirm', 'appointment', p_id, jsonb_build_object('via', 'email_token'));
  return v_row;
end $$;
revoke all on function token_confirm_appointment(uuid) from public, anon, authenticated;

create or replace function token_cancel_appointment(p_id uuid, p_reason text default null)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments; v_min int;
begin
  select a.* into v_row from appointments a where a.id = p_id and a.status in ('scheduled','confirmed') for update;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  select min_cancel_hours into v_min from clinic_settings where clinic_id = v_row.clinic_id;
  if v_row.starts_at < now() + make_interval(hours => v_min) then
    raise exception 'too_late' using errcode = 'P0001';
  end if;
  update appointments set status = 'cancelled', cancel_reason = p_reason, cancelled_at = now()
  where id = p_id returning * into v_row;
  insert into audit_log (actor_type, action, entity, entity_id, diff)
  values ('patient', 'cancel', 'appointment', p_id, jsonb_build_object('reason', p_reason, 'via', 'email_token'));
  return v_row;
end $$;
revoke all on function token_cancel_appointment(uuid, text) from public, anon, authenticated;

create or replace function token_reschedule_appointment(p_id uuid, p_new_start timestamptz)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_old appointments; v_new appointments; v_dur int; v_min int;
begin
  select a.* into v_old from appointments a where a.id = p_id and a.status in ('scheduled','confirmed') for update;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  select min_cancel_hours into v_min from clinic_settings where clinic_id = v_old.clinic_id;
  if v_old.starts_at < now() + make_interval(hours => v_min) then
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
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, source, rescheduled_from)
  values (v_old.clinic_id, v_old.doctor_id, v_old.patient_id, v_old.type_id, p_new_start,
          p_new_start + make_interval(mins => v_dur), 'patient', p_id)
  returning * into v_new;
  insert into audit_log (actor_type, action, entity, entity_id, diff)
  values ('patient', 'reschedule', 'appointment', v_new.id,
          jsonb_build_object('from', p_id, 'old_start', v_old.starts_at, 'new_start', p_new_start, 'via', 'email_token'));
  return v_new;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = 'P0001';
end $$;
revoke all on function token_reschedule_appointment(uuid, timestamptz) from public, anon, authenticated;
