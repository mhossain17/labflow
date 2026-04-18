-- COPPA consent flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coppa_consented boolean NOT NULL DEFAULT false;

-- Data retention setting on organizations (months, 0 = no auto-delete)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS data_retention_months integer NOT NULL DEFAULT 12;
