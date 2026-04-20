-- ============================================================
-- Keep classes.teacher_id and class_teachers in sync
-- ============================================================

-- Backfill: every class owner should also have a lead_teacher membership.
INSERT INTO public.class_teachers (
  class_id,
  teacher_id,
  class_role,
  can_manage_roster,
  can_manage_assignments,
  can_manage_grades,
  can_edit_class_settings,
  added_by
)
SELECT
  c.id,
  c.teacher_id,
  'lead_teacher',
  true,
  true,
  true,
  true,
  COALESCE(c.created_by, c.teacher_id)
FROM public.classes c
WHERE c.teacher_id IS NOT NULL
ON CONFLICT (class_id, teacher_id) DO UPDATE
SET
  class_role = 'lead_teacher',
  can_manage_roster = true,
  can_manage_assignments = true,
  can_manage_grades = true,
  can_edit_class_settings = true,
  added_by = COALESCE(class_teachers.added_by, EXCLUDED.added_by);

CREATE OR REPLACE FUNCTION public.sync_class_owner_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.teacher_id IS NOT NULL THEN
    INSERT INTO public.class_teachers (
      class_id,
      teacher_id,
      class_role,
      can_manage_roster,
      can_manage_assignments,
      can_manage_grades,
      can_edit_class_settings,
      added_by
    )
    VALUES (
      NEW.id,
      NEW.teacher_id,
      'lead_teacher',
      true,
      true,
      true,
      true,
      COALESCE(NEW.created_by, NEW.teacher_id)
    )
    ON CONFLICT (class_id, teacher_id) DO UPDATE
    SET
      class_role = 'lead_teacher',
      can_manage_roster = true,
      can_manage_assignments = true,
      can_manage_grades = true,
      can_edit_class_settings = true,
      added_by = COALESCE(class_teachers.added_by, EXCLUDED.added_by);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_classes_sync_owner_membership ON public.classes;
CREATE TRIGGER trg_classes_sync_owner_membership
AFTER INSERT OR UPDATE OF teacher_id ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.sync_class_owner_membership();

-- Compatibility: treat classes.teacher_id as valid ownership in helper functions.
CREATE OR REPLACE FUNCTION public.teacher_has_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    LEFT JOIN public.class_teachers ct
      ON ct.class_id = ce.class_id
     AND ct.teacher_id = p_teacher_id
    WHERE ce.student_id = p_student_id
      AND (ct.teacher_id IS NOT NULL OR c.teacher_id = p_teacher_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid, p_teacher_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    LEFT JOIN public.class_teachers ct
      ON ct.class_id = c.id
     AND ct.teacher_id = p_teacher_id
    WHERE c.id = p_class_id
      AND (ct.teacher_id IS NOT NULL OR c.teacher_id = p_teacher_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.teacher_can(p_class_id uuid, p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.class_teachers
      WHERE class_id = p_class_id
        AND teacher_id = auth.uid()
        AND CASE p_permission
              WHEN 'manage_roster'      THEN can_manage_roster
              WHEN 'manage_assignments' THEN can_manage_assignments
              WHEN 'manage_grades'      THEN can_manage_grades
              WHEN 'edit_settings'      THEN can_edit_class_settings
              ELSE false
            END
    )
    OR EXISTS (
      SELECT 1
      FROM public.classes
      WHERE id = p_class_id
        AND teacher_id = auth.uid()
    );
$$;
