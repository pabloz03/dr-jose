-- Bug real encontrado al escribir los tests de E0-S3 (el SQL del handoff
-- solo estaba validado sintácticamente, tal como se advirtió): la
-- exclusión por citas existentes en get_available_slots extendía el
-- buffer del TIPO que se está consultando (candidato), pero nunca el
-- buffer del tipo de la cita YA EXISTENTE. Resultado: una cita con
-- buffer_after_min=15 no protegía el tiempo posterior frente a una
-- reserva nueva de un tipo sin buffer — el buffer solo "miraba hacia
-- adelante" desde el candidato, nunca desde la cita ya puesta.
-- Fix: comparar el rango de la cita existente YA extendido por el buffer
-- de SU PROPIO tipo contra el rango del candidato extendido por el suyo
-- — protege ambas direcciones con una sola condición de solape simétrica.
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
      join appointment_types at2 on at2.id = a.type_id
      where a.doctor_id = p_doctor and a.status in ('scheduled','confirmed')
        and tstzrange(a.starts_at, a.ends_at + make_interval(mins => at2.buffer_after_min), '[)') &&
            tstzrange(c.s, c.s + make_interval(mins => c.duration_min + c.buffer_after_min), '[)'))
  order by c.s
$$;
grant execute on function get_available_slots(uuid,uuid,uuid,date,date) to authenticated;
revoke execute on function get_available_slots(uuid,uuid,uuid,date,date) from public, anon;
