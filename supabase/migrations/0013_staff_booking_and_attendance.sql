-- E6-S4: "permite fuera de la ventana de anticipación (staff)". El
-- min_lead_hours de get_available_slots es una regla de autoservicio del
-- paciente, no una regla física del consultorio — se agrega un parámetro
-- para que el personal pueda saltarla, reusando la MISMA lógica de
-- horarios/excepciones/citas existentes (nunca duplicarla en otra
-- función, eso es lo que diverge con el tiempo).
drop function if exists get_available_slots(uuid, uuid, uuid, date, date);

create function get_available_slots(
  p_clinic uuid, p_doctor uuid, p_type uuid, p_from date, p_to date,
  p_ignore_lead_time boolean default false
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
  where (p_ignore_lead_time or c.s >= now() + make_interval(hours => c.min_lead_hours))
    and not exists (
      select 1 from time_off o
      where o.doctor_id = p_doctor and (o.clinic_id is null or o.clinic_id = p_clinic)
        and tstzrange(o.starts_at, o.ends_at, '[)') &&
            tstzrange(c.s, c.s + make_interval(mins => c.duration_min + c.buffer_after_min), '[)'))
    and not exists (
      select 1 from appointments a
      join appointment_types at2 on at2.id = a.type_id
      where a.doctor_id = p_doctor and a.status in ('scheduled','confirmed')
        and tstzrange(a.starts_at, a.ends_at + make_interval(mins => at2.buffer_after_min), '[)') &&
            tstzrange(c.s, c.s + make_interval(mins => c.duration_min + c.buffer_after_min), '[)'))
  order by c.s
$$;
grant execute on function get_available_slots(uuid,uuid,uuid,date,date,boolean) to authenticated;
revoke execute on function get_available_slots(uuid,uuid,uuid,date,date,boolean) from public, anon;

-- E6-S4: cita manual por staff (llamada telefónica, paciente existente o
-- invitado). No pasa por book_appointment porque esa exige
-- guardian_user_id = auth.uid() (dueño del paciente) — aquí el dueño es
-- quien sea, y quien reserva es staff en su nombre.
create or replace function book_appointment_staff(
  p_patient uuid, p_type uuid, p_clinic uuid, p_doctor uuid, p_start timestamptz
) returns appointments
language plpgsql security definer set search_path = public as $$
declare v_dur int; v_row appointments;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from patients where id = p_patient and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (
    select 1 from get_available_slots(p_clinic, p_doctor, p_type,
      (p_start at time zone 'America/Guatemala')::date, (p_start at time zone 'America/Guatemala')::date,
      true)
    where slot_start = p_start) then
    raise exception 'slot_unavailable' using errcode = 'P0001';
  end if;
  select duration_min into v_dur from appointment_types where id = p_type;
  insert into appointments (clinic_id, doctor_id, patient_id, type_id, starts_at, ends_at, source, created_by)
  values (p_clinic, p_doctor, p_patient, p_type, p_start, p_start + make_interval(mins => v_dur), 'doctor', auth.uid())
  returning * into v_row;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id)
  values (auth.uid(), 'doctor', 'book_manual', 'appointment', v_row.id);
  return v_row;
exception when exclusion_violation then
  raise exception 'slot_unavailable' using errcode = 'P0001';
end $$;
grant execute on function book_appointment_staff(uuid,uuid,uuid,uuid,timestamptz) to authenticated;
revoke execute on function book_appointment_staff(uuid,uuid,uuid,uuid,timestamptz) from public, anon;

-- E6-S3: marcar asistencia. No es una tabla de escritura libre para
-- staff (appts_staff ya lo permitiría) porque entonces quedaría sin
-- auditar y sin la regla "no_show solo en citas pasadas".
create or replace function mark_appointment_attendance(p_id uuid, p_status appointment_status)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status not in ('completed', 'no_show') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;
  select * into v_row from appointments where id = p_id for update;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status = 'no_show' and v_row.starts_at > now() then
    raise exception 'appointment_not_past' using errcode = 'P0001';
  end if;
  update appointments set status = p_status where id = p_id returning * into v_row;
  insert into audit_log (actor_user_id, actor_type, action, entity, entity_id, diff)
  values (auth.uid(), 'doctor', 'mark_attendance', 'appointment', p_id, jsonb_build_object('status', p_status));
  return v_row;
end $$;
grant execute on function mark_appointment_attendance(uuid, appointment_status) to authenticated;
revoke execute on function mark_appointment_attendance(uuid, appointment_status) from public, anon;
