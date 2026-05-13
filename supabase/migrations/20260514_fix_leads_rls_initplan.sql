-- Fix Supabase Performance Advisor: Auth RLS Initialization Plan.
--
-- Wrapping auth.role() in a SELECT lets Postgres evaluate the role once per
-- statement instead of once per row for these service-only policies.

ALTER POLICY "Service read leads"
  ON public.leads
  USING ((SELECT auth.role()) = 'service_role');

ALTER POLICY "Service write leads"
  ON public.leads
  WITH CHECK ((SELECT auth.role()) = 'service_role');
