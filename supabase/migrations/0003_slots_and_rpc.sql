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
  left join patients p on p.id = a.patient_id
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
  left join patients p on p.id = a.patient_id
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

-- Auto-confirmación 12h antes (resuelve qué hacer con citas no confirmadas,
-- sin violar D10: nunca auto-cancela, solo auto-confirma). Llamado por
-- pg_cron cada 15 min (0004); no requiere Edge Function porque no manda
-- email, solo cambia estado — el comprobante lo gestiona el flujo normal.
create or replace function auto_confirm_due_appointments()
returns setof appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  for v_row in
    update appointments
    set status = 'confirmed', confirmed_at = now()
    where status = 'scheduled'
      and starts_at <= now() + interval '12 hours'
    returning *
  loop
    insert into audit_log (actor_type, action, entity, entity_id)
    values ('system', 'auto_confirm', 'appointment', v_row.id);
    return next v_row;
  end loop;
end $$;
revoke all on function auto_confirm_due_appointments() from public, anon, authenticated;

-- Pacientes invitados reclamables por el tutor autenticado (mismo email de
-- contacto que capturó staff). Solo lectura: la UI confirma antes de llamar
-- a claim_patients — nunca se reasigna automáticamente.
create or replace function claimable_guest_patients()
returns setof patients
language sql stable security definer set search_path = public as $$
  select p.* from patients p
  where p.guardian_user_id is null
    and p.contact_email is not null
    and lower(p.contact_email) = lower((select email from auth.users where id = auth.uid()))
$$;
grant execute on function claimable_guest_patients() to authenticated;

create or replace function claim_patients(p_patient_ids uuid[])
returns setof patients
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    update patients set guardian_user_id = auth.uid()
    where id = any(p_patient_ids)
      and guardian_user_id is null
      and contact_email is not null
      and lower(contact_email) = lower(v_email)
    returning *;
end $$;
grant execute on function claim_patients(uuid[]) to authenticated;
