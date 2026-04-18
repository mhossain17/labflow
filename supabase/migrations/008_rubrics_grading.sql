-- Rubric criteria authored by teachers per lab
CREATE TABLE public.rubric_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id      uuid        NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  max_points  integer     NOT NULL DEFAULT 10,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.rubric_items (lab_id);

-- Overall grade record for a submitted lab run
CREATE TABLE public.student_grades (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id      uuid        UNIQUE NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  teacher_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_score     numeric,
  max_score       numeric,
  letter_grade    text,
  overall_comment text,
  graded_at       timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Per-criterion scores (self-assessment and teacher scores)
CREATE TABLE public.rubric_scores (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id      uuid        NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  rubric_item_id  uuid        NOT NULL REFERENCES public.rubric_items(id) ON DELETE CASCADE,
  self_score      numeric,
  teacher_score   numeric,
  teacher_comment text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_run_id, rubric_item_id)
);

-- RLS
ALTER TABLE public.rubric_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;

-- rubric_items: teachers manage their own labs' rubrics; students read published labs in their classes
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

-- student_grades: teachers write for their students; students read own records
CREATE POLICY "teachers_manage_grades" ON public.student_grades
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "students_read_own_grades" ON public.student_grades
  FOR SELECT USING (
    lab_run_id IN (
      SELECT id FROM public.student_lab_runs WHERE student_id = auth.uid()
    )
  );

-- rubric_scores: teachers write teacher_score/comment; students write self_score; both read own rows
CREATE POLICY "teachers_manage_rubric_scores" ON public.rubric_scores
  FOR ALL USING (
    lab_run_id IN (
      SELECT slr.id FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "students_manage_own_rubric_scores" ON public.rubric_scores
  FOR ALL USING (
    lab_run_id IN (
      SELECT id FROM public.student_lab_runs WHERE student_id = auth.uid()
    )
  );
