create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create extension if not exists pg_net with schema extensions;

-- auto_confirm_due_appointments() ya es funcional (0003): se activa ya.
select cron.schedule(
  'auto-confirm-appointments', '*/15 * * * *',
  $$ select auto_confirm_due_appointments(); $$
);

-- send-reminders depende de la Edge Function y del secreto en Vault que se
-- despliegan en E4. Registrarlo antes generaría un job fallando cada 15
-- min contra un endpoint inexistente — se agrega en la migración de E4
-- junto con el deploy real:
--
-- select cron.schedule(
--   'send-reminders', '*/15 * * * *',
--   $$ select net.http_post(
--        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
--        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--        body := '{}'::jsonb) $$
-- );
