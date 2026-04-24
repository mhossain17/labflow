-- ============================================================
-- Helper functions
-- ============================================================

-- my_role: returns NULL for pending_review users (blocks all access)
-- and for super_admin with no org
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE
    WHEN status = 'pending_review' THEN NULL
    ELSE role
  END
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- my_org: returns organization_id (nullable for super_admin)
CREATE OR REPLACE FUNCTION public.my_org()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- teacher_has_student: checks via class_teachers junction + legacy teacher_id
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

-- student_enrolled_in_class
CREATE OR REPLACE FUNCTION public.student_enrolled_in_class(p_class_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id AND student_id = p_student_id
  );
$$;

-- is_teacher_of_class: checks class_teachers junction + legacy teacher_id
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

-- teacher_can: checks a specific permission flag for a teacher in a class
CREATE OR REPLACE FUNCTION public.teacher_can(p_class_id uuid, p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.class_teachers
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
      SELECT 1 FROM public.classes
      WHERE id = p_class_id AND teacher_id = auth.uid()
    );
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_materials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_lab_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lab_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_lab_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- organizations
-- No anon SELECT policy — signup uses lookup_org_by_signup_code()
-- which is SECURITY DEFINER and safe for anonymous callers
-- ============================================================
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    id = public.my_org()
    OR public.my_role() = 'super_admin'
  );

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (
    id = public.my_org()
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_teacher" ON public.profiles
  FOR SELECT USING (
    public.my_role() = 'teacher'
    AND organization_id = public.my_org()
    AND public.teacher_has_student(auth.uid(), profiles.id)
  );

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    AND (
      public.my_role() = 'super_admin'
      OR organization_id = public.my_org()
    )
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    AND (
      public.my_role() = 'super_admin'
      OR organization_id = public.my_org()
    )
  );

-- ============================================================
-- user_settings
-- ============================================================
CREATE POLICY "user_settings_all" ON public.user_settings
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- classes
-- ============================================================
CREATE POLICY "classes_select_teacher_admin" ON public.classes
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.is_teacher_of_class(classes.id, auth.uid())
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "classes_select_student" ON public.classes
  FOR SELECT USING (
    public.my_role() = 'student'
    AND public.student_enrolled_in_class(classes.id, auth.uid())
  );

CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT WITH CHECK (
    (teacher_id = auth.uid() AND public.my_role() = 'teacher')
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE USING (
    teacher_id = auth.uid()
    OR public.teacher_can(classes.id, 'edit_settings')
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- class_enrollments
-- ============================================================
CREATE POLICY "enrollments_select_teacher_admin" ON public.class_enrollments
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(class_enrollments.class_id, auth.uid())
    OR student_id = auth.uid()
  );

CREATE POLICY "enrollments_insert" ON public.class_enrollments
  FOR INSERT WITH CHECK (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.teacher_can(class_enrollments.class_id, 'manage_roster')
  );

CREATE POLICY "enrollments_delete" ON public.class_enrollments
  FOR DELETE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.teacher_can(class_enrollments.class_id, 'manage_roster')
  );

-- ============================================================
-- class_teachers
-- ============================================================
CREATE POLICY "class_teachers_select" ON public.class_teachers
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_teachers ct2
      WHERE ct2.class_id = class_teachers.class_id
        AND ct2.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('school_admin', 'super_admin')
        AND c.id = class_teachers.class_id
    )
  );

CREATE POLICY "class_teachers_insert" ON public.class_teachers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('school_admin', 'super_admin')
        AND c.id = class_teachers.class_id
    )
  );

CREATE POLICY "class_teachers_update" ON public.class_teachers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('school_admin', 'super_admin')
        AND c.id = class_teachers.class_id
    )
  );

CREATE POLICY "class_teachers_delete" ON public.class_teachers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classes c ON c.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('school_admin', 'super_admin')
        AND c.id = class_teachers.class_id
    )
  );

-- ============================================================
-- teacher_materials
-- ============================================================
CREATE POLICY "materials_select" ON public.teacher_materials
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "materials_insert" ON public.teacher_materials
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    AND organization_id = public.my_org()
    AND public.my_role() IN ('teacher', 'school_admin')
  );

CREATE POLICY "materials_delete" ON public.teacher_materials
  FOR DELETE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- labs
-- ============================================================
CREATE POLICY "labs_select_teacher_admin" ON public.labs
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.lab_assignments la
      WHERE la.lab_id = labs.id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

CREATE POLICY "labs_select_student" ON public.labs
  FOR SELECT USING (
    public.my_role() = 'student'
    AND status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.lab_assignments la
      JOIN public.class_enrollments ce ON ce.class_id = la.class_id
      WHERE la.lab_id = labs.id
        AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "labs_insert" ON public.labs
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    AND organization_id = public.my_org()
    AND public.my_role() IN ('teacher', 'school_admin', 'super_admin')
  );

CREATE POLICY "labs_update" ON public.labs
  FOR UPDATE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "labs_delete" ON public.labs
  FOR DELETE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- pre_lab_questions
-- ============================================================
CREATE POLICY "pre_lab_questions_select" ON public.pre_lab_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = pre_lab_questions.lab_id
        AND (
          l.teacher_id = auth.uid()
          OR public.my_role() IN ('school_admin', 'super_admin')
          OR (
            public.my_role() = 'student'
            AND l.status = 'published'
            AND EXISTS (
              SELECT 1
              FROM public.lab_assignments la
              JOIN public.class_enrollments ce ON ce.class_id = la.class_id
              WHERE la.lab_id = l.id AND ce.student_id = auth.uid()
            )
          )
        )
    )
  );

CREATE POLICY "pre_lab_questions_insert" ON public.pre_lab_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = pre_lab_questions.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

CREATE POLICY "pre_lab_questions_update" ON public.pre_lab_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = pre_lab_questions.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

CREATE POLICY "pre_lab_questions_delete" ON public.pre_lab_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = pre_lab_questions.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

-- ============================================================
-- lab_steps
-- ============================================================
CREATE POLICY "lab_steps_select" ON public.lab_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = lab_steps.lab_id
        AND (
          l.teacher_id = auth.uid()
          OR public.my_role() IN ('school_admin', 'super_admin')
          OR (
            public.my_role() = 'student'
            AND l.status = 'published'
            AND EXISTS (
              SELECT 1
              FROM public.lab_assignments la
              JOIN public.class_enrollments ce ON ce.class_id = la.class_id
              WHERE la.lab_id = l.id AND ce.student_id = auth.uid()
            )
          )
        )
    )
  );

CREATE POLICY "lab_steps_insert" ON public.lab_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = lab_steps.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

CREATE POLICY "lab_steps_update" ON public.lab_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = lab_steps.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

CREATE POLICY "lab_steps_delete" ON public.lab_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.labs l
      WHERE l.id = lab_steps.lab_id
        AND (l.teacher_id = auth.uid() OR public.my_role() IN ('school_admin', 'super_admin'))
    )
  );

-- ============================================================
-- lab_assignments
-- ============================================================
CREATE POLICY "lab_assignments_select_teacher_admin" ON public.lab_assignments
  FOR SELECT USING (
    assigned_by = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(lab_assignments.class_id, auth.uid())
  );

CREATE POLICY "lab_assignments_select_student" ON public.lab_assignments
  FOR SELECT USING (
    public.my_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      WHERE ce.class_id = lab_assignments.class_id
        AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "lab_assignments_insert" ON public.lab_assignments
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid()
    AND (
      public.my_role() IN ('school_admin', 'super_admin')
      OR public.teacher_can(lab_assignments.class_id, 'manage_assignments')
    )
  );

CREATE POLICY "lab_assignments_delete" ON public.lab_assignments
  FOR DELETE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR (
      assigned_by = auth.uid()
      AND public.teacher_can(lab_assignments.class_id, 'manage_assignments')
    )
    OR public.teacher_can(lab_assignments.class_id, 'manage_assignments')
  );

-- ============================================================
-- student_lab_runs
-- ============================================================
CREATE POLICY "lab_runs_select_student" ON public.student_lab_runs
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "lab_runs_select_teacher_admin" ON public.student_lab_runs
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.lab_assignments la
      WHERE la.id = student_lab_runs.assignment_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

CREATE POLICY "lab_runs_insert" ON public.student_lab_runs
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND public.my_role() = 'student'
  );

CREATE POLICY "lab_runs_update" ON public.student_lab_runs
  FOR UPDATE USING (student_id = auth.uid());

-- ============================================================
-- pre_lab_responses
-- ============================================================
CREATE POLICY "pre_lab_responses_student" ON public.pre_lab_responses
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "pre_lab_responses_teacher_admin_select" ON public.pre_lab_responses
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = pre_lab_responses.lab_run_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

-- ============================================================
-- step_responses
-- ============================================================
CREATE POLICY "step_responses_student" ON public.step_responses
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "step_responses_teacher_admin_select" ON public.step_responses
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = step_responses.lab_run_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

-- ============================================================
-- help_requests
-- ============================================================
CREATE POLICY "help_requests_student" ON public.help_requests
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "help_requests_teacher_admin_select" ON public.help_requests
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = help_requests.lab_run_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

CREATE POLICY "help_requests_teacher_admin_update" ON public.help_requests
  FOR UPDATE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR (
      public.my_role() = 'teacher'
      AND EXISTS (
        SELECT 1
        FROM public.student_lab_runs slr
        JOIN public.lab_assignments la ON la.id = slr.assignment_id
        WHERE slr.id = help_requests.lab_run_id
          AND public.is_teacher_of_class(la.class_id, auth.uid())
      )
    )
  );

-- ============================================================
-- feature_flags
-- ============================================================
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT USING (organization_id = public.my_org());

CREATE POLICY "feature_flags_admin_all" ON public.feature_flags
  FOR ALL USING (
    organization_id = public.my_org()
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- rubric_items
-- ============================================================
CREATE POLICY "teachers_manage_rubric_items" ON public.rubric_items
  FOR ALL USING (
    lab_id IN (SELECT id FROM public.labs WHERE teacher_id = auth.uid())
  );

CREATE POLICY "students_read_rubric_items" ON public.rubric_items
  FOR SELECT USING (
    lab_id IN (
      SELECT la.lab_id FROM public.lab_assignments la
      JOIN public.class_enrollments ce ON ce.class_id = la.class_id
      WHERE ce.student_id = auth.uid()
    )
  );

-- ============================================================
-- student_grades
-- ============================================================
CREATE POLICY "grades_select_student" ON public.student_grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_lab_runs slr
      WHERE slr.id = student_grades.lab_run_id
        AND slr.student_id = auth.uid()
    )
  );

CREATE POLICY "grades_select_teacher_admin" ON public.student_grades
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = student_grades.lab_run_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

CREATE POLICY "grades_insert_teacher" ON public.student_grades
  FOR INSERT WITH CHECK (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = student_grades.lab_run_id
        AND public.teacher_can(la.class_id, 'manage_grades')
    )
  );

CREATE POLICY "grades_update_teacher" ON public.student_grades
  FOR UPDATE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = student_grades.lab_run_id
        AND public.teacher_can(la.class_id, 'manage_grades')
    )
  );

-- ============================================================
-- rubric_scores
-- ============================================================
CREATE POLICY "rubric_scores_student" ON public.rubric_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_lab_runs slr
      WHERE slr.id = rubric_scores.lab_run_id
        AND slr.student_id = auth.uid()
    )
  );

CREATE POLICY "rubric_scores_teacher_admin" ON public.rubric_scores
  FOR ALL USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      WHERE slr.id = rubric_scores.lab_run_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );
