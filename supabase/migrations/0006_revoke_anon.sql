-- El advisor seguía marcando acceso de `anon` tras 0005: Supabase aplica
-- `alter default privileges` que otorga EXECUTE a `anon` y `authenticated`
-- explícitamente al crear una función, independiente del grant a PUBLIC
-- que ya se revocó. Ninguna de estas funciones debe ser invocable sin
-- sesión (todas dependen de auth.uid()) — se revoca de `anon` puntualmente.
revoke execute on function is_staff() from anon;
revoke execute on function is_doctor() from anon;
revoke execute on function get_available_slots(uuid,uuid,uuid,date,date) from anon;
revoke execute on function book_appointment(uuid,uuid,uuid,uuid,timestamptz) from anon;
revoke execute on function cancel_appointment(uuid,text) from anon;
revoke execute on function confirm_appointment(uuid) from anon;
revoke execute on function reschedule_appointment(uuid,timestamptz) from anon;
revoke execute on function appointments_affected_by(uuid,uuid,timestamptz,timestamptz) from anon;
revoke execute on function claimable_guest_patients() from anon;
revoke execute on function claim_patients(uuid[]) from anon;
