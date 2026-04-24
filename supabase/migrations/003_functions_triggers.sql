-- ============================================================
-- Generic updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_student_lab_runs_updated_at
BEFORE UPDATE ON public.student_lab_runs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_labs_updated_at
BEFORE UPDATE ON public.labs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_help_requests_updated_at
BEFORE UPDATE ON public.help_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_student_grades_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- handle_new_user: auto-create profile + settings on signup
-- organization_id is nullable (super_admin has no org)
-- teachers start as pending_review until approved
-- ============================================================
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

  -- Staff (teachers) require admin approval before gaining access
  v_status := CASE
    WHEN v_role = 'teacher' THEN 'pending_review'::public.profile_status
    ELSE 'active'::public.profile_status
  END;

  INSERT INTO public.profiles (id, organization_id, role, status, first_name, last_name)
  VALUES (NEW.id, v_organization_id, v_role, v_status, v_first_name, v_last_name);

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- sync_role_to_app_metadata: keep app_metadata.role in sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_role
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_app_metadata();

-- ============================================================
-- sync_role_on_insert: set app_metadata.role on new profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_role_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_role_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_on_insert();

-- ============================================================
-- generate_org_code: random 8-char alphanumeric code
-- Omits visually ambiguous characters (0, O, 1, l, I)
-- Retries on collision against both student_code and staff_code
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_org_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chars text := 'abcdefghjkmnpqrstuvwxyz23456789';
  code  text;
  taken boolean;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS (
      SELECT 1 FROM public.organizations
      WHERE student_code = code OR staff_code = code
    ) INTO taken;
    EXIT WHEN NOT taken;
  END LOOP;
  RETURN code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_org_code() TO authenticated;

-- ============================================================
-- lookup_org_by_signup_code: resolve a join code to org + role
-- SECURITY DEFINER so anonymous (unauthenticated) callers can
-- use it during signup without open SELECT on organizations.
-- ============================================================
CREATE TYPE public.signup_code_lookup AS (
  org_id        uuid,
  assigned_role public.user_role
);

CREATE OR REPLACE FUNCTION public.lookup_org_by_signup_code(code text)
RETURNS public.signup_code_lookup LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  normalised text := lower(trim(code));
  result     public.signup_code_lookup;
BEGIN
  -- Check student_code first
  SELECT id, 'student'::public.user_role
  INTO result.org_id, result.assigned_role
  FROM public.organizations
  WHERE student_code = normalised
  LIMIT 1;

  IF result.org_id IS NOT NULL THEN
    RETURN result;
  END IF;

  -- Check staff_code
  SELECT id, 'teacher'::public.user_role
  INTO result.org_id, result.assigned_role
  FROM public.organizations
  WHERE staff_code = normalised
  LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_org_by_signup_code(text) TO anon, authenticated;

-- ============================================================
-- sync_class_owner_membership: keep class_teachers in sync
-- with classes.teacher_id when a class is created/updated
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_class_owner_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.teacher_id IS NOT NULL THEN
    INSERT INTO public.class_teachers (
      class_id, teacher_id, class_role,
      can_manage_roster, can_manage_assignments,
      can_manage_grades, can_edit_class_settings, added_by
    )
    VALUES (
      NEW.id, NEW.teacher_id, 'lead_teacher',
      true, true, true, true,
      COALESCE(NEW.created_by, NEW.teacher_id)
    )
    ON CONFLICT (class_id, teacher_id) DO UPDATE
    SET
      class_role              = 'lead_teacher',
      can_manage_roster       = true,
      can_manage_assignments  = true,
      can_manage_grades       = true,
      can_edit_class_settings = true,
      added_by = COALESCE(class_teachers.added_by, EXCLUDED.added_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_classes_sync_owner_membership
AFTER INSERT OR UPDATE OF teacher_id ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.sync_class_owner_membership();
