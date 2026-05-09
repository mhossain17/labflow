-- ============================================================
-- Google Classroom Integration
-- ============================================================

-- Store Google OAuth tokens per teacher (service-role-only access)
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider    text        NOT NULL DEFAULT 'google',
  access_token  text      NOT NULL,
  refresh_token text,
  expires_at  timestamptz,
  scopes      text[],
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Track which Google Classroom course is linked to each LabFlow class
CREATE TABLE IF NOT EXISTS public.google_classroom_links (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id           uuid        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  google_course_id   text        NOT NULL,
  google_course_name text,
  teacher_id         uuid        NOT NULL REFERENCES public.profiles(id),
  last_synced_at     timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id)
);

-- RLS: tokens are only ever touched by server-side service role
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_tokens"
  ON public.user_oauth_tokens
  USING (false);

-- RLS: teachers can see their own links
ALTER TABLE public.google_classroom_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_own_links"
  ON public.google_classroom_links
  FOR ALL
  USING (teacher_id = auth.uid());

-- Auto-update updated_at on token upserts
CREATE OR REPLACE FUNCTION public.set_oauth_token_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_oauth_token_updated_at
  BEFORE UPDATE ON public.user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_oauth_token_updated_at();
