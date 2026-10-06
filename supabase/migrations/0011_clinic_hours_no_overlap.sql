-- E5-S2 AC: "no permite franjas superpuestas". La validación en el form
-- es solo UX — la garantía real va en la base, igual que no_double_booking
-- para citas. time no tiene un range type nativo en Postgres; se usa
-- minutos-desde-medianoche como int4range (btree_gist ya habilitado).
alter table clinic_hours add constraint clinic_hours_no_overlap
  exclude using gist (
    clinic_id with =,
    doctor_id with =,
    weekday with =,
    int4range(
      (extract(epoch from start_time) / 60)::int,
      (extract(epoch from end_time) / 60)::int,
      '[)'
    ) with &&
  );
