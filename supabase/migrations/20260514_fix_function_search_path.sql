-- Fix Supabase Security Advisor: Function Search Path Mutable.
--
-- Pin public functions to a known search_path so function execution cannot be
-- influenced by a caller-controlled role/database search_path.

ALTER FUNCTION public.monthly_verified_count()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.submission_count_by_ip(p_ip inet, p_hours integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;
