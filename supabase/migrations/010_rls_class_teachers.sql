-- ============================================================
-- Update RLS policies to respect class_teachers membership
-- Co-teachers have full instructional access to their classes
-- ============================================================

-- ============================================================
-- Helper functions: updated to check class_teachers
-- ============================================================

-- teacher_has_student: checks via class_teachers junction
CREATE OR REPLACE FUNCTION public.teacher_has_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.class_teachers ct ON ct.class_id = ce.class_id
    WHERE ce.student_id = p_student_id
      AND ct.teacher_id = p_teacher_id
  );
$$;

-- is_teacher_of_class: checks class_teachers junction
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_class_id uuid, p_teacher_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_teachers
    WHERE class_id = p_class_id AND teacher_id = p_teacher_id
  );
$$;

-- teacher_can: checks a specific permission flag for a teacher in a class
CREATE OR REPLACE FUNCTION public.teacher_can(p_class_id uuid, p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
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
  );
$$;

-- ============================================================
-- classes: extend to check class_teachers
-- ============================================================
DROP POLICY IF EXISTS "classes_select_teacher_admin" ON public.classes;
CREATE POLICY "classes_select_teacher_admin" ON public.classes
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.is_teacher_of_class(classes.id, auth.uid())
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

DROP POLICY IF EXISTS "classes_update" ON public.classes;
CREATE POLICY "classes_update" ON public.classes
  FOR UPDATE USING (
    teacher_id = auth.uid()
    OR public.teacher_can(classes.id, 'edit_settings')
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

DROP POLICY IF EXISTS "classes_delete" ON public.classes;
CREATE POLICY "classes_delete" ON public.classes
  FOR DELETE USING (
    teacher_id = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- Allow admins to insert classes (without requiring teacher_id = auth.uid())
DROP POLICY IF EXISTS "classes_insert" ON public.classes;
CREATE POLICY "classes_insert" ON public.classes
  FOR INSERT WITH CHECK (
    (teacher_id = auth.uid() AND public.my_role() IN ('teacher'))
    OR public.my_role() IN ('school_admin', 'super_admin')
  );

-- ============================================================
-- class_enrollments: use is_teacher_of_class (already updated above)
-- Extend insert/delete to check can_manage_roster
-- ============================================================
DROP POLICY IF EXISTS "enrollments_insert" ON public.class_enrollments;
CREATE POLICY "enrollments_insert" ON public.class_enrollments
  FOR INSERT WITH CHECK (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.teacher_can(class_enrollments.class_id, 'manage_roster')
  );

DROP POLICY IF EXISTS "enrollments_delete" ON public.class_enrollments;
CREATE POLICY "enrollments_delete" ON public.class_enrollments
  FOR DELETE USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR public.teacher_can(class_enrollments.class_id, 'manage_roster')
  );

-- ============================================================
-- lab_assignments: extend teacher select + restrict insert/delete
-- ============================================================
DROP POLICY IF EXISTS "lab_assignments_select_teacher_admin" ON public.lab_assignments;
CREATE POLICY "lab_assignments_select_teacher_admin" ON public.lab_assignments
  FOR SELECT USING (
    assigned_by = auth.uid()
    OR public.my_role() IN ('school_admin', 'super_admin')
    OR public.is_teacher_of_class(lab_assignments.class_id, auth.uid())
  );

DROP POLICY IF EXISTS "lab_assignments_insert" ON public.lab_assignments;
CREATE POLICY "lab_assignments_insert" ON public.lab_assignments
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid()
    AND (
      public.my_role() IN ('school_admin', 'super_admin')
      OR public.teacher_can(lab_assignments.class_id, 'manage_assignments')
    )
  );

DROP POLICY IF EXISTS "lab_assignments_delete" ON public.lab_assignments;
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
-- student_lab_runs: extend teacher select via class_teachers
-- ============================================================
DROP POLICY IF EXISTS "lab_runs_select_teacher_admin" ON public.student_lab_runs;
CREATE POLICY "lab_runs_select_teacher_admin" ON public.student_lab_runs
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.lab_assignments la
      WHERE la.id = student_lab_runs.assignment_id
        AND public.is_teacher_of_class(la.class_id, auth.uid())
    )
  );

-- ============================================================
-- pre_lab_responses: extend teacher read via class_teachers
-- ============================================================
DROP POLICY IF EXISTS "pre_lab_responses_teacher_admin_select" ON public.pre_lab_responses;
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
-- step_responses: extend teacher read via class_teachers
-- ============================================================
DROP POLICY IF EXISTS "step_responses_teacher_admin_select" ON public.step_responses;
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
-- help_requests: extend teacher access via class_teachers
-- ============================================================
DROP POLICY IF EXISTS "help_requests_teacher_admin_select" ON public.help_requests;
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

DROP POLICY IF EXISTS "help_requests_teacher_admin_update" ON public.help_requests;
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
-- student_grades / rubric_scores: teacher access via class_teachers
-- ============================================================
DO $$
BEGIN
  -- student_grades: enable RLS if not already
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'student_grades' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "grades_select_student" ON public.student_grades;
CREATE POLICY "grades_select_student" ON public.student_grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_lab_runs slr
      WHERE slr.id = student_grades.lab_run_id
        AND slr.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "grades_select_teacher_admin" ON public.student_grades;
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

DROP POLICY IF EXISTS "grades_insert_teacher" ON public.student_grades;
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

DROP POLICY IF EXISTS "grades_update_teacher" ON public.student_grades;
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

-- rubric_scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'rubric_scores' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "rubric_scores_student" ON public.rubric_scores;
CREATE POLICY "rubric_scores_student" ON public.rubric_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_lab_runs slr
      WHERE slr.id = rubric_scores.lab_run_id
        AND slr.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "rubric_scores_teacher_admin" ON public.rubric_scores;
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

-- labs: extend teacher select to include labs assigned to co-teacher's classes
DROP POLICY IF EXISTS "labs_select_teacher_admin" ON public.labs;
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
