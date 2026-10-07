-- Bug real encontrado probando el flujo de bloqueos COMO el doctor
-- autenticado (no con privilegios de servicio, que lo ocultaban): el
-- trigger de auditoría de time_off (0014) no era `security definer`,
-- así que corría con los privilegios del doctor real (rol
-- `authenticated`) al intentar escribir en audit_log — tabla que solo
-- tiene política de SELECT para `authenticated` (audit_staff_read),
-- ninguna de INSERT. Cualquier intento real de crear o borrar un
-- bloqueo fallaba con "new row violates row-level security policy for
-- table audit_log" y revertía toda la transacción. Todas las demás
-- escrituras a audit_log del proyecto pasan por RPC `security definer`
-- (cancel_appointment, book_appointment_staff, token_*, etc.), que sí
-- bypasean RLS — este trigger era la única excepción porque time_off
-- se escribe directo desde el cliente, no vía RPC.
create or replace function audit_time_off_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_log (actor_user_id, actor_type, action, entity, entity_id, diff)
    values (auth.uid(), 'doctor', 'create', 'time_off', new.id,
      jsonb_build_object('starts_at', new.starts_at, 'ends_at', new.ends_at, 'clinic_id', new.clinic_id, 'reason', new.reason));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_log (actor_user_id, actor_type, action, entity, entity_id, diff)
    values (auth.uid(), 'doctor', 'delete', 'time_off', old.id,
      jsonb_build_object('starts_at', old.starts_at, 'ends_at', old.ends_at, 'clinic_id', old.clinic_id, 'reason', old.reason));
    return old;
  end if;
  return null;
end $$;
