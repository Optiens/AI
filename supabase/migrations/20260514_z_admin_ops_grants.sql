-- Grants for server-side admin dashboard APIs that use the Supabase service role key.

grant usage on schema public to service_role;

grant all on table public.admin_settings to service_role;
grant all on table public.admin_audit_logs to service_role;
grant all on table public.knowledge_entries to service_role;

grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;
