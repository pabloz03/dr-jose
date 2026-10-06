-- E1-S2: el consentimiento del aviso de privacidad debe quedar guardado
-- con fecha (AC del handoff), no solo como checkbox efímero en el form.
alter table profiles add column if not exists privacy_consent_at timestamptz;
