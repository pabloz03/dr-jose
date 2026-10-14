-- Horario real del doctor en "Dental Familiar" (única clínica del
-- sistema): las dos filas existentes (jueves y sábado, ambas "todas
-- las semanas") en realidad solo correspondían a la 1ª semana; se
-- completan las demás ocurrencias según lo que confirmó el doctor.
update clinic_hours set week_of_month = 1 where id = '266a9d12-34c0-40eb-a04f-45e171a3b37a'; -- jueves 9:00-17:00
update clinic_hours set week_of_month = 1 where id = '20b0118d-fecf-44d0-b22e-1efec728695a'; -- sábado 11:30-14:00

insert into clinic_hours (clinic_id, doctor_id, weekday, start_time, end_time, week_of_month) values
  ('00000000-0000-0000-0000-000000000001','6c7ac772-fc6c-4b47-bbee-6d95ca1c704e', 4, '09:00','17:00', 3),
  ('00000000-0000-0000-0000-000000000001','6c7ac772-fc6c-4b47-bbee-6d95ca1c704e', 6, '08:00','14:00', 2),
  ('00000000-0000-0000-0000-000000000001','6c7ac772-fc6c-4b47-bbee-6d95ca1c704e', 6, '13:00','14:30', 3),
  ('00000000-0000-0000-0000-000000000001','6c7ac772-fc6c-4b47-bbee-6d95ca1c704e', 6, '08:00','14:00', 4);
-- A propósito: sin fila week_of_month = 5 para sábado — el doctor
-- pidió dejarlo sin definir por ahora. Un 5º sábado queda cerrado por
-- simple ausencia de regla, como cualquier día sin horario.
