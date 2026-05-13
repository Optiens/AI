-- Tighten existing dashboard grants after explicit Data API migration.
--
-- Some legacy Supabase defaults may already grant more than SELECT to
-- anon/authenticated. Revoke first, then add back read-only access.

DO $$
BEGIN
  IF to_regclass('public.sensor_data') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.sensor_data FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.sensor_data TO anon, authenticated';
  END IF;

  IF to_regclass('public.cycles') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.cycles FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.cycles TO anon, authenticated';
  END IF;

  IF to_regclass('public.alerts') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.alerts FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.alerts TO anon, authenticated';
  END IF;

  IF to_regclass('public.power_log') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.power_log FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.power_log TO anon, authenticated';
  END IF;

  IF to_regclass('public.unit_economics') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.unit_economics FROM anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.unit_economics TO anon, authenticated';
  END IF;
END $$;
