-- Register the freee OAuth setting row used by server-side payment checks.
-- The actual refresh_token is written at runtime by src/lib/freee-oauth.ts.

insert into public.admin_settings (key, value, description, updated_by)
values (
  'freee_oauth',
  jsonb_build_object('provider', 'freee', 'managed_by', 'src/lib/freee-oauth.ts'),
  'freee OAuth refresh token. Updated automatically when freee rotates tokens.',
  'migration:20260515_freee_oauth_setting'
)
on conflict (key) do update
set
  description = excluded.description,
  updated_at = now(),
  updated_by = excluded.updated_by;
