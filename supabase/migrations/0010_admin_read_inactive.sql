-- E5: el doctor necesita ver clínicas y tipos de cita INACTIVOS en el
-- admin (para reactivarlos), pero clinics_read/types_read solo exponen
-- is_active=true (correcto para el paciente). Se agrega una política de
-- select adicional solo para is_doctor(), sin tocar la de paciente.
create policy clinics_doctor_read on clinics for select to authenticated using (is_doctor());
create policy types_doctor_read on appointment_types for select to authenticated using (is_doctor());
