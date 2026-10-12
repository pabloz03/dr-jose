-- Dashboard de métricas (admin): dos funciones de solo lectura,
-- gated a staff, que devuelven filas por DÍA (no pre-agregadas a
-- semana/mes) para que el cliente decida el bucket sin dos formas
-- de RPC distintas. El día se calcula con la zona horaria de CADA
-- clínica (c.timezone), nunca una constante — el esquema ya soporta
-- timezone por clínica aunque hoy todas sean "America/Guatemala".
-- Mismo patrón que mark_appointment_attendance para el gate de
-- autorización (`if not is_staff() then raise exception...`, no un
-- `where is_staff()` silencioso) — un no-staff recibe 403, no un
-- dashboard "vacío" que enmascararía un bug real de autorización en
-- el router si alguna vez un paciente llegara a invocar esto.

create or replace function get_dashboard_appointment_metrics(p_from timestamptz, p_to timestamptz)
returns table (
  day date, clinic_id uuid, clinic_name text, type_id uuid, type_name text,
  status appointment_status, n_appointments bigint, n_confirmed bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select
      (a.starts_at at time zone c.timezone)::date as day,
      c.id, c.name, t.id, t.name, a.status,
      count(*)::bigint,
      -- confirmed_at IS NOT NULL, no solo status='confirmed': una cita
      -- que ya avanzó a 'completed' no debe "perder" su confirmación
      -- previa de la tasa de confirmación.
      count(*) filter (where a.confirmed_at is not null)::bigint
    from appointments a
    join clinics c on c.id = a.clinic_id
    join appointment_types t on t.id = a.type_id
    where a.starts_at >= p_from and a.starts_at < p_to
    group by 1, 2, 3, 4, 5, 6
    order by 1;
end;
$$;
grant execute on function get_dashboard_appointment_metrics(timestamptz, timestamptz) to authenticated;
revoke execute on function get_dashboard_appointment_metrics(timestamptz, timestamptz) from public, anon;

-- "nuevo" = su primera cita jamás (cualquier estado) cae en el rango.
-- El distinct on corre sobre TODAS las citas del paciente, no solo
-- las del rango — si se filtrara antes, una cita posterior dentro del
-- rango de un paciente cuya primera cita real quedó afuera contaría
-- como "nuevo" por error. patients no tiene clinic_id (registro
-- global de la práctica), por eso esta función no agrupa por clínica.
create or replace function get_dashboard_new_patients(p_from timestamptz, p_to timestamptz)
returns table (day date, n_new_patients bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    with first_appt as (
      select distinct on (a.patient_id) a.patient_id, a.starts_at, a.clinic_id
      from appointments a
      order by a.patient_id, a.starts_at asc
    )
    select (f.starts_at at time zone c.timezone)::date, count(*)::bigint
    from first_appt f
    join clinics c on c.id = f.clinic_id
    where f.starts_at >= p_from and f.starts_at < p_to
    group by 1
    order by 1;
end;
$$;
grant execute on function get_dashboard_new_patients(timestamptz, timestamptz) to authenticated;
revoke execute on function get_dashboard_new_patients(timestamptz, timestamptz) from public, anon;
