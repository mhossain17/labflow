-- ============================================================
-- Helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_org()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Cross-table helpers (SECURITY DEFINER prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.teacher_has_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    WHERE ce.student_id = p_student_id AND c.teacher_id = p_teacher_id
  );
$$;

CREATE OR REPLACE FUNCTION public.student_enrolled_in_class(p_class_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id AND student_id = p_student_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid, p_teacher_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = p_teacher_id
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

-- ============================================================
-- organizations
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
-- Own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Teacher sees students enrolled in their classes
CREATE POLICY "profiles_select_teacher" ON public.profiles
  FOR SELECT USING (
    public.my_role() = 'teacher'
    AND organization_id = public.my_org()
    AND public.teacher_has_student(auth.uid(), profiles.id)
  );

-- Admin sees all within org (super_admin sees all)
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    AND (
      public.my_role() = 'super_admin'
      OR organization_id = public.my_org()
    )
  );

-- Update own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin can update profiles in same org
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    organization_id = public.my_org()
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- user_settings
-- ============================================================
CREATE POLICY "user_settings_all" ON public.user_settings
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- classes
-- ============================================================
-- Teacher or admin select
CREATE POLICY "classes_select_teacher_admin" ON public.classes
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- Student sees enrolled classes
CREATE POLICY "classes_select_student" ON public.classes
  FOR SELECT USING (
    public.my_role() = 'student'
    AND public.student_enrolled_in_class(classes.id, auth.uid())
  );

-- Insert: teacher or admin in same org
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    AND organization_id = public.my_org()
    AND public.my_role() IN ('teacher', 'school_admin', 'super_admin')
  );

-- Update: class owner or admin
CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- Delete: class owner or admin
CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- class_enrollments
-- ============================================================
-- Teacher of the class, admin, or own student record can select
CREATE POLICY "enrollments_select_teacher_admin" ON public.class_enrollments
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(class_enrollments.class_id, auth.uid())
    OR student_id = auth.uid()
  );

-- Teacher of the class or admin can insert
CREATE POLICY "enrollments_insert" ON public.class_enrollments
  FOR INSERT WITH CHECK (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(class_enrollments.class_id, auth.uid())
  );

-- Teacher of the class or admin can delete
CREATE POLICY "enrollments_delete" ON public.class_enrollments
  FOR DELETE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(class_enrollments.class_id, auth.uid())
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
-- Teacher or admin select
CREATE POLICY "labs_select_teacher_admin" ON public.labs
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- Student sees published labs assigned to their enrolled class
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
-- pre_lab_questions  (inherit parent lab visibility)
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
              WHERE la.lab_id = l.id
                AND ce.student_id = auth.uid()
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
-- lab_steps  (inherit parent lab visibility)
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
              WHERE la.lab_id = l.id
                AND ce.student_id = auth.uid()
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
-- Teacher, assigner, or admin select
CREATE POLICY "lab_assignments_select_teacher_admin" ON public.lab_assignments
  FOR SELECT USING (
    assigned_by = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = lab_assignments.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Student sees assignments for their enrolled classes
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
    AND public.my_role() IN ('teacher', 'school_admin', 'super_admin')
  );

CREATE POLICY "lab_assignments_delete" ON public.lab_assignments
  FOR DELETE USING (
    assigned_by = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- student_lab_runs
-- ============================================================
-- Student sees own runs
CREATE POLICY "lab_runs_select_student" ON public.student_lab_runs
  FOR SELECT USING (student_id = auth.uid());

-- Teacher/admin sees runs for their classes
CREATE POLICY "lab_runs_select_teacher_admin" ON public.student_lab_runs
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.lab_assignments la
      JOIN public.classes c ON c.id = la.class_id
      WHERE la.id = student_lab_runs.assignment_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Only students can insert their own runs
CREATE POLICY "lab_runs_insert" ON public.student_lab_runs
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND public.my_role() = 'student'
  );

-- Students can update their own runs
CREATE POLICY "lab_runs_update" ON public.student_lab_runs
  FOR UPDATE USING (student_id = auth.uid());

-- ============================================================
-- pre_lab_responses
-- ============================================================
-- Student CRUD own responses
CREATE POLICY "pre_lab_responses_student" ON public.pre_lab_responses
  FOR ALL USING (student_id = auth.uid());

-- Teacher/admin read via assignment chain
CREATE POLICY "pre_lab_responses_teacher_admin_select" ON public.pre_lab_responses
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE slr.id = pre_lab_responses.lab_run_id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- step_responses
-- ============================================================
-- Student CRUD own responses
CREATE POLICY "step_responses_student" ON public.step_responses
  FOR ALL USING (student_id = auth.uid());

-- Teacher/admin read via assignment chain
CREATE POLICY "step_responses_teacher_admin_select" ON public.step_responses
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE slr.id = step_responses.lab_run_id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- help_requests
-- ============================================================
-- Student CRUD own help requests
CREATE POLICY "help_requests_student" ON public.help_requests
  FOR ALL USING (student_id = auth.uid());

-- Teacher/admin read via assignment chain
CREATE POLICY "help_requests_teacher_admin_select" ON public.help_requests
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE slr.id = help_requests.lab_run_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Teacher/admin can update (e.g. resolve, escalate)
CREATE POLICY "help_requests_teacher_admin_update" ON public.help_requests
  FOR UPDATE USING (
    public.my_role() IN ('teacher', 'school_admin', 'super_admin')
    AND EXISTS (
      SELECT 1
      FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE slr.id = help_requests.lab_run_id
        AND (
          c.teacher_id = auth.uid()
          OR public.my_role() IN ('school_admin', 'super_admin')
        )
    )
  );

-- ============================================================
-- feature_flags
-- ============================================================
-- Any authenticated user in the org can read flags
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT USING (organization_id = public.my_org());

-- Admins can manage flags for their org
CREATE POLICY "feature_flags_admin_all" ON public.feature_flags
  FOR ALL USING (
    organization_id = public.my_org()
    AND public.my_role() IN ('school_admin', 'super_admin')
  );
