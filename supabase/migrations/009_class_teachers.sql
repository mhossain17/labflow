-- ============================================================
-- class_teachers junction table for multi-teacher class support
-- ============================================================

CREATE TABLE IF NOT EXISTS public.class_teachers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id                uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_role              text NOT NULL DEFAULT 'co_teacher'
                          CHECK (class_role IN ('lead_teacher', 'co_teacher')),
  can_manage_roster       boolean NOT NULL DEFAULT true,
  can_manage_assignments  boolean NOT NULL DEFAULT true,
  can_manage_grades       boolean NOT NULL DEFAULT true,
  can_edit_class_settings boolean NOT NULL DEFAULT false,
  added_by                uuid REFERENCES public.profiles(id),
  created_at              timestamptz DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS class_teachers_class_id_idx    ON public.class_teachers(class_id);
CREATE INDEX IF NOT EXISTS class_teachers_teacher_id_idx  ON public.class_teachers(teacher_id);

-- Attribution column on classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);
UPDATE public.classes SET created_by = teacher_id WHERE created_by IS NULL;

-- Backfill: existing classes.teacher_id → lead_teacher with full settings access
INSERT INTO public.class_teachers (class_id, teacher_id, class_role, can_edit_class_settings, added_by)
SELECT id, teacher_id, 'lead_teacher', true, teacher_id
FROM public.classes
WHERE teacher_id IS NOT NULL
ON CONFLICT (class_id, teacher_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS policies for class_teachers
-- ============================================================

-- Any teacher assigned to the class can view all class_teachers rows for that class
-- Admins see all within their org
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

-- Only admins can insert/update/delete teacher assignments
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
