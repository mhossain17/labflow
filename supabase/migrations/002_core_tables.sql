-- ============================================================
-- organizations
-- ============================================================
CREATE TABLE public.organizations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        NOT NULL UNIQUE,
  logo_url         text,
  primary_color    text        NOT NULL DEFAULT '#2563EB',
  secondary_color  text        NOT NULL DEFAULT '#7C3AED',
  footer_text      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- profiles  (1:1 extension of auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role             public.user_role NOT NULL DEFAULT 'student',
  first_name       text        NOT NULL DEFAULT '',
  last_name        text        NOT NULL DEFAULT '',
  avatar_url       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_organization_id ON public.profiles (organization_id);
CREATE INDEX idx_profiles_role             ON public.profiles (role);

-- ============================================================
-- user_settings
-- ============================================================
CREATE TABLE public.user_settings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme                public.theme_preference NOT NULL DEFAULT 'system',
  email_notifications  boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- classes
-- ============================================================
CREATE TABLE public.classes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  teacher_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  description      text,
  period           text,
  school_year      text,
  archived         boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_teacher_id      ON public.classes (teacher_id);
CREATE INDEX idx_classes_organization_id ON public.classes (organization_id);

-- ============================================================
-- class_enrollments
-- ============================================================
CREATE TABLE public.class_enrollments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX idx_class_enrollments_student_id ON public.class_enrollments (student_id);
CREATE INDEX idx_class_enrollments_class_id   ON public.class_enrollments (class_id);

-- ============================================================
-- teacher_materials
-- ============================================================
CREATE TABLE public.teacher_materials (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name        text        NOT NULL,
  storage_path     text        NOT NULL,
  mime_type        text        NOT NULL,
  size_bytes       bigint,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_materials_teacher_id ON public.teacher_materials (teacher_id);

-- ============================================================
-- labs
-- ============================================================
CREATE TABLE public.labs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  teacher_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             text        NOT NULL,
  overview          text,
  objectives        text[]      NOT NULL DEFAULT '{}',
  standards         text[]      NOT NULL DEFAULT '{}',
  materials_list    text[]      NOT NULL DEFAULT '{}',
  safety_notes      text,
  background        text,
  teacher_notes     text,
  status            public.lab_status NOT NULL DEFAULT 'draft',
  ai_generated      boolean     NOT NULL DEFAULT false,
  estimated_minutes integer,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_labs_teacher_id      ON public.labs (teacher_id);
CREATE INDEX idx_labs_organization_id ON public.labs (organization_id);
CREATE INDEX idx_labs_status          ON public.labs (status);

-- ============================================================
-- pre_lab_questions
-- ============================================================
CREATE TABLE public.pre_lab_questions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id         uuid    NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  position       integer NOT NULL DEFAULT 0,
  question_text  text    NOT NULL,
  question_type  text    NOT NULL DEFAULT 'short_answer'
                         CHECK (question_type IN ('short_answer', 'multiple_choice', 'true_false')),
  options        jsonb,   -- for multiple_choice: ["A","B","C"]
  correct_answer text,
  required       boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pre_lab_questions_lab_id ON public.pre_lab_questions (lab_id);

-- ============================================================
-- lab_steps
-- ============================================================
CREATE TABLE public.lab_steps (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id             uuid    NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  step_number        integer NOT NULL,
  title              text    NOT NULL,
  instructions       text    NOT NULL,
  checkpoint         text,
  data_entry_fields  jsonb,  -- [{label, type, unit, min, max, required}]
  reflection_prompt  text,
  troubleshooting    text,
  image_url          text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, step_number)
);

CREATE INDEX idx_lab_steps_lab_id_step_number ON public.lab_steps (lab_id, step_number);

-- ============================================================
-- lab_assignments
-- ============================================================
CREATE TABLE public.lab_assignments (
  id                   uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id               uuid  NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  class_id             uuid  NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by          uuid  NOT NULL REFERENCES public.profiles(id),
  due_date             date,
  instructions_override text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, class_id)
);

CREATE INDEX idx_lab_assignments_lab_id   ON public.lab_assignments (lab_id);
CREATE INDEX idx_lab_assignments_class_id ON public.lab_assignments (class_id);

-- ============================================================
-- student_lab_runs
-- ============================================================
CREATE TABLE public.student_lab_runs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id      uuid        NOT NULL REFERENCES public.lab_assignments(id) ON DELETE CASCADE,
  student_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lab_id             uuid        NOT NULL REFERENCES public.labs(id),
  current_step       integer     NOT NULL DEFAULT 0,  -- 0 = pre-lab
  prelab_completed   boolean     NOT NULL DEFAULT false,
  status             public.student_work_status NOT NULL DEFAULT 'on_track',
  quick_note         text,
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX idx_student_lab_runs_student_id    ON public.student_lab_runs (student_id);
CREATE INDEX idx_student_lab_runs_assignment_id ON public.student_lab_runs (assignment_id);
CREATE INDEX idx_student_lab_runs_lab_id        ON public.student_lab_runs (lab_id);

-- ============================================================
-- pre_lab_responses
-- ============================================================
CREATE TABLE public.pre_lab_responses (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id     uuid        NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  question_id    uuid        NOT NULL REFERENCES public.pre_lab_questions(id) ON DELETE CASCADE,
  student_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_text  text,
  is_valid       boolean,
  saved_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_run_id, question_id)
);

CREATE INDEX idx_pre_lab_responses_lab_run_id ON public.pre_lab_responses (lab_run_id);

-- ============================================================
-- step_responses
-- ============================================================
CREATE TABLE public.step_responses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id       uuid        NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  step_id          uuid        NOT NULL REFERENCES public.lab_steps(id) ON DELETE CASCADE,
  student_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_values      jsonb,      -- {fieldLabel: value}
  reflection_text  text,
  flags            jsonb,      -- [{field, rule, message}]
  completed        boolean     NOT NULL DEFAULT false,
  saved_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_run_id, step_id)
);

CREATE INDEX idx_step_responses_lab_run_id ON public.step_responses (lab_run_id);
CREATE INDEX idx_step_responses_step_id    ON public.step_responses (step_id);

-- ============================================================
-- help_requests
-- ============================================================
CREATE TABLE public.help_requests (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id            uuid        NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  student_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_id               uuid        REFERENCES public.lab_steps(id),
  escalated_to_teacher  boolean     NOT NULL DEFAULT false,
  conversation          jsonb       NOT NULL DEFAULT '[]'::jsonb,  -- [{role, content, ts}]
  resolved              boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_help_requests_lab_run_id ON public.help_requests (lab_run_id);
CREATE INDEX idx_help_requests_student_id ON public.help_requests (student_id);

-- ============================================================
-- feature_flags
-- ============================================================
CREATE TABLE public.feature_flags (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  flag_key         text        NOT NULL,
  enabled          boolean     NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, flag_key)
);

CREATE INDEX idx_feature_flags_organization_id ON public.feature_flags (organization_id);
