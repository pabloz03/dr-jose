-- Seed mínimo de producción: una clínica y tipos de cita de ejemplo,
-- EDITABLES por el doctor desde /admin/ajustes (no es un catálogo fijo).
-- Altas de staff (doctor/asistente) se hacen a mano tras su primer login
-- OTP — no hay auto-provisión en v1.
insert into clinics (id, name, timezone)
values ('00000000-0000-0000-0000-000000000001', 'Clínica Dr. José Rodríguez', 'America/Guatemala')
on conflict (id) do nothing;

insert into clinic_settings (clinic_id, min_cancel_hours, min_lead_hours, max_booking_days, slot_step_min, reminder_local_time)
values ('00000000-0000-0000-0000-000000000001', 24, 2, 90, 10, '10:00')
on conflict (clinic_id) do nothing;

insert into appointment_types (name, duration_min, sort)
select v.name, v.duration_min, v.sort
from (values ('Primera consulta', 40, 1), ('Control', 20, 2)) as v(name, duration_min, sort)
where not exists (select 1 from appointment_types t where t.name = v.name);
