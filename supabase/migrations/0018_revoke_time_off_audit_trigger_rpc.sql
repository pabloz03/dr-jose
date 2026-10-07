-- audit_time_off_change() es un trigger, nunca debe llamarse como RPC
-- directo — el fix anterior (0017) la hizo security definer para que el
-- trigger funcione bajo RLS real, pero eso también la dejó expuesta vía
-- /rest/v1/rpc/audit_time_off_change a cualquiera (hallazgo real del
-- advisor de seguridad tras aplicar 0017). Mismo patrón que el resto de
-- funciones sensibles del proyecto: revocar de public/anon/authenticated.
-- Verificado que el trigger sigue disparando normalmente tras el revoke
-- (la ejecución vía trigger no depende del EXECUTE del rol que hace el
-- INSERT/DELETE, solo la llamada directa como RPC sí).
revoke all on function audit_time_off_change() from public, anon, authenticated;
