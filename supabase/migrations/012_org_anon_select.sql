-- Allow unauthenticated users to read organizations (needed for signup org-code lookup)
CREATE POLICY "org_select_by_slug_anon" ON public.organizations
  FOR SELECT USING (true);
