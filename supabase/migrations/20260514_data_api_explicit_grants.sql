-- Supabase Data API explicit grants
--
-- Supabase is changing public-schema Data API exposure in 2026:
-- new public objects should opt in with explicit GRANT statements.
-- Keep sensitive Optiens tables server-only, and keep dashboard data read-only.

-- Future objects in public should not be exposed automatically.
-- Existing objects keep their current grants until changed below.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Sensitive/application tables: all access goes through Astro API routes or
-- Supabase Edge Functions using SUPABASE_SERVICE_ROLE_KEY.
DO $$
BEGIN
  IF to_regclass('public.diagnosis_leads') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.diagnosis_leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.diagnosis_leads FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.diagnosis_leads TO service_role';
  END IF;

  IF to_regclass('public.submission_log') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.submission_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.submission_log FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.submission_log TO service_role';
  END IF;

  IF to_regclass('public.novel_review_notes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.novel_review_notes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.novel_review_notes FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.novel_review_notes TO service_role';
  END IF;

  IF to_regclass('public.leads') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.leads FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO service_role';
  END IF;

  IF to_regclass('public.devices') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.devices FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.devices TO service_role';
  END IF;
END $$;

-- Public dashboard tables: read-only for anonymous/authenticated API clients,
-- write access remains server/device-side only through service_role.
DO $$
BEGIN
  IF to_regclass('public.sensor_data') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.sensor_data TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sensor_data TO service_role';
  END IF;

  IF to_regclass('public.cycles') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.cycles TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cycles TO service_role';
  END IF;

  IF to_regclass('public.alerts') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.alerts TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.alerts TO service_role';
  END IF;

  IF to_regclass('public.power_log') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.power_log TO anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.power_log TO service_role';
  END IF;

  IF to_regclass('public.unit_economics') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.unit_economics TO anon, authenticated, service_role';
  END IF;
END $$;

-- Internal monitoring view for quota retries.
DO $$
BEGIN
  IF to_regclass('public.v_diagnosis_quota_retry_queue') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.v_diagnosis_quota_retry_queue FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.v_diagnosis_quota_retry_queue TO service_role';
  END IF;
END $$;

-- RPC functions used by server-side rate-limit/quota checks.
DO $$
BEGIN
  IF to_regprocedure('public.monthly_verified_count()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON FUNCTION public.monthly_verified_count() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.monthly_verified_count() TO service_role';
  END IF;

  IF to_regprocedure('public.submission_count_by_ip(inet, integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON FUNCTION public.submission_count_by_ip(inet, integer) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.submission_count_by_ip(inet, integer) TO service_role';
  END IF;
END $$;

-- Service-side inserts need sequence privileges for serial/bigserial IDs.
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
