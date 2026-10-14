-- El doctor ya no trabaja las mismas horas cada semana del mes (ver
-- conversación): algunos días solo abre el 1er/3er jueves, o con
-- horas distintas cada sábado del mes. clinic_hours era puramente
-- semanal (weekday + rango de horas, sin noción de "qué ocurrencia
-- del mes es esta fecha"). week_of_month nullable (1-5) resuelve esto
-- sin romper ninguna fila existente: NULL sigue significando "todas
-- las semanas", exactamente el comportamiento de hoy.
alter table clinic_hours
  add column week_of_month smallint check (week_of_month between 1 and 5);

-- La exclusion constraint comparaba solo (clinic_id, doctor_id,
-- weekday) + solape de horas — con eso, insertar varias franjas de
-- sábado que se solapan en hora de reloj pero pertenecen a semanas
-- distintas (ej. 11:30-14:00 la semana 1, 08:00-14:00 la semana 2)
-- sería rechazado de una. coalesce(week_of_month, 0) agrupa las filas
-- "todas las semanas" (NULL) entre sí para seguir detectando ese
-- conflicto real (una exclusion constraint nunca trata dos NULL como
-- iguales, igual que un unique constraint — sin el coalesce esa
-- detección se perdería) y a la vez separa cada semana específica en
-- su propio grupo, donde el solape de horas con otra semana ya no es
-- conflicto.
alter table clinic_hours drop constraint clinic_hours_no_overlap;
alter table clinic_hours add constraint clinic_hours_no_overlap
  exclude using gist (
    clinic_id with =,
    doctor_id with =,
    weekday with =,
    coalesce(week_of_month, 0) with =,
    int4range(
      (extract(epoch from start_time) / 60)::int,
      (extract(epoch from end_time) / 60)::int,
      '[)'
    ) with &&
  );

-- Mismo cuerpo que la función ya desplegada (0013_staff_booking_and_attendance.sql,
-- 6 parámetros con p_ignore_lead_time) con una sola condición añadida
-- al join de clinic_hours en la CTE windows: una fila con
-- week_of_month aplica solo en su ocurrencia del mes
-- (ceil(día-del-mes / 7) — fórmula estándar: día 1-7→1ª ocurrencia,
-- 8-14→2ª, 15-21→3ª, 22-28→4ª, 29-31→5ª, válida para cualquier día de
-- la semana porque cada uno se repite exactamente cada 7 días); una
-- fila sin week_of_month sigue aplicando todas las semanas.
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
      and (w.week_of_month is null or w.week_of_month = ceil(extract(day from dy.day) / 7.0)::int)
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
