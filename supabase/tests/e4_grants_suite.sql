-- Suite de verificación E4: privilegios de las funciones que solo debe
-- poder llamar service_role (nunca anon/authenticated vía PostgREST).
-- Corre entero en UNA transacción con ROLLBACK al final — no deja
-- rastro. Mismo patrón que supabase/tests/e0_s3_suite.sql.
begin;

create temporary table test_results (
  id serial primary key,
  suite text not null,
  name text not null,
  passed boolean not null,
  detail text
);

create or replace function pg_temp.assert_true(p_suite text, p_name text, p_condition boolean, p_detail text default null)
returns void language plpgsql security definer as $$
begin
  insert into test_results (suite, name, passed, detail) values (p_suite, p_name, coalesce(p_condition, false), p_detail);
end $$;

do $$
declare
  v_fn text;
begin
  foreach v_fn in array array[
    'due_reminders()',
    'auto_confirm_due_appointments()',
    'token_confirm_appointment(uuid)',
    'token_cancel_appointment(uuid,text)',
    'token_reschedule_appointment(uuid,timestamptz)'
  ]
  loop
    perform pg_temp.assert_true('grants', v_fn || ' service_role puede ejecutar',
      has_function_privilege('service_role', v_fn, 'execute'));
    perform pg_temp.assert_true('grants', v_fn || ' anon NO puede ejecutar',
      not has_function_privilege('anon', v_fn, 'execute'));
    perform pg_temp.assert_true('grants', v_fn || ' authenticated NO puede ejecutar',
      not has_function_privilege('authenticated', v_fn, 'execute'));
  end loop;
end $$;

select suite, name, passed, detail from test_results order by passed asc, suite, id;
select count(*) filter (where not passed) as failed, count(*) as total from test_results;

rollback;
