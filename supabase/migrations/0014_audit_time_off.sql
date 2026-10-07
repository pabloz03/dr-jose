-- E7-S1/S3 AC: crear y eliminar un bloqueo debe quedar auditado. time_off
-- se escribe directo desde el cliente (RLS ya lo protege con is_doctor()),
-- así que la auditoría va en un trigger de tabla en vez de depender de que
-- cada call-site se acuerde de insertar en audit_log a mano.
create or replace function audit_time_off_change() returns trigger
language plpgsql set search_path = public as $$
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

create trigger time_off_audit_insert after insert on time_off for each row execute function audit_time_off_change();
create trigger time_off_audit_delete after delete on time_off for each row execute function audit_time_off_change();
