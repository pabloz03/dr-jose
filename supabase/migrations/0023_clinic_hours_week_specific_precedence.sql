-- 0021 permitía que una franja "todas las semanas" (week_of_month
-- null) y una franja de semana específica para el mismo día de la
-- semana coexistieran y se UNIERAN en get_available_slots (igual que
-- el exclusion constraint las trata como grupos distintos a propósito
-- — ver 0021). El problema: si la franja específica tiene horario
-- MENOR que la general (ej. el doctor cierra más temprano un sábado
-- puntual), la fila general seguía ofreciendo slots hasta su hora de
-- cierre normal esa semana, ignorando en silencio la reducción — la
-- intención evidente de una franja específica es reemplazar, no
-- sumarse. Se corrige con el mismo patrón de precedencia que ya usa
-- esta función entre clinic_hours y schedule_exceptions (un NOT
-- EXISTS que suprime la regla general cuando hay una más específica):
-- una fila "todas las semanas" solo aplica en una fecha si NO existe
-- una fila de semana específica para esa misma ocurrencia del mes.
create or replace function get_available_slots(
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
      and (
        w.week_of_month = ceil(extract(day from dy.day) / 7.0)::int
        or (
          w.week_of_month is null
          and not exists (
            select 1 from clinic_hours w2
            where w2.clinic_id = w.clinic_id and w2.doctor_id = w.doctor_id
              and w2.weekday = w.weekday
              and w2.week_of_month = ceil(extract(day from dy.day) / 7.0)::int
          )
        )
      )
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
