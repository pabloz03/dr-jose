-- E2: el paciente necesita leer qué doctor(es) atienden la clínica para
-- reservar (nombre a mostrar, id para get_available_slots). full_name/role
-- no son datos sensibles; user_id ya era legible indirectamente vía
-- is_staff()/is_doctor(). Se agrega lectura general en vez de ampliar
-- staff_self_read, que debe seguir acotada a "mi propia fila para editar".
create policy staff_read on staff for select to authenticated using (true);
