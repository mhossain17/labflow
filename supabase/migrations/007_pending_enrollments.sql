-- ============================================================
-- 007: Pending enrollments + email on profiles
-- ============================================================

-- 1. Add email column to profiles so we can search/lookup by email
--    without joining auth.users (which requires service-role).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users for existing rows
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 2. Update handle_new_user to populate email going forward
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_organization_id  uuid;
  v_role             public.user_role;
  v_status           public.profile_status;
  v_first_name       text;
  v_last_name        text;
BEGIN
  v_organization_id := NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid;
  v_role            := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'student')::public.user_role;
  v_first_name      := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name       := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  v_status := CASE
    WHEN v_role = 'teacher' THEN 'pending_review'::public.profile_status
    ELSE 'active'::public.profile_status
  END;

  INSERT INTO public.profiles (id, organization_id, role, status, first_name, last_name, email)
  VALUES (NEW.id, v_organization_id, v_role, v_status, v_first_name, v_last_name, NEW.email);

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- 3. Modify class_enrollments to support pending (invite-only) rows
--    Drop NOT NULL on student_id and add status + invited_email columns.
ALTER TABLE public.class_enrollments
  ALTER COLUMN student_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending')),
  ADD COLUMN IF NOT EXISTS invited_email text;

-- Replace the unique constraint on (class_id, student_id) with partial indexes
--   so pending rows (student_id IS NULL) don't collide with each other.
ALTER TABLE public.class_enrollments
  DROP CONSTRAINT IF EXISTS class_enrollments_class_id_student_id_key;

-- Unique active enrollment per student per class
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_enrollments_unique_active
  ON public.class_enrollments (class_id, student_id)
  WHERE student_id IS NOT NULL;

-- Unique pending invite per email per class
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_enrollments_unique_pending
  ON public.class_enrollments (class_id, invited_email)
  WHERE status = 'pending' AND invited_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_enrollments_invited_email
  ON public.class_enrollments (invited_email)
  WHERE invited_email IS NOT NULL;

-- 4. Trigger: when a new profile is created, activate any pending
--    enrollments that were pre-invited with that email address.
CREATE OR REPLACE FUNCTION public.activate_pending_enrollments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.class_enrollments
  SET
    student_id    = NEW.id,
    status        = 'active',
    invited_email = NULL
  WHERE invited_email = NEW.email
    AND status        = 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_pending_enrollments ON public.profiles;
CREATE TRIGGER trg_activate_pending_enrollments
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.activate_pending_enrollments();
