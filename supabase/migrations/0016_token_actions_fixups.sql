-- Ajustes menores de db-reviewer sobre 0015_token_actions.sql:
-- 1) token_confirm_appointment ahora registra el mismo 'via':'email_token'
--    en audit_log.diff que token_cancel_appointment/token_reschedule_appointment,
--    por consistencia de trazabilidad (no había PII en ningún caso).
-- 2) Grant explícito a service_role en las tres funciones: hasta ahora
--    dependían solo de que `revoke ... from public, anon, authenticated`
--    deje intacto el EXECUTE heredado por defecto del esquema public —
--    correcto hoy (verificado con has_function_privilege), pero implícito.
--    Hacerlo explícito evita que un futuro cambio de privilegios por
--    defecto del esquema rompa estas funciones en silencio.

create or replace function token_confirm_appointment(p_id uuid)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  update appointments set status = 'confirmed', confirmed_at = now()
  where id = p_id and status = 'scheduled'
  returning * into v_row;
  if not found then raise exception 'forbidden_or_invalid_state' using errcode = '42501'; end if;
  insert into audit_log (actor_type, action, entity, entity_id, diff)
  values ('patient', 'confirm', 'appointment', p_id, jsonb_build_object('via', 'email_token'));
  return v_row;
end $$;
revoke all on function token_confirm_appointment(uuid) from public, anon, authenticated;
grant execute on function token_confirm_appointment(uuid) to service_role;
grant execute on function token_cancel_appointment(uuid, text) to service_role;
grant execute on function token_reschedule_appointment(uuid, timestamptz) to service_role;
