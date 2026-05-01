-- ============================================================
-- Rich demo activity seed
-- Run AFTER:
--   1. supabase/seed-data.sql
--
-- This file adds rubric items, a draft lab, student lab runs,
-- realistic responses, help-chat escalation, and grading artifacts
-- for a full live-demo storyline.
-- ============================================================

BEGIN;

-- ============================================================
-- RUBRIC ITEMS (Density lab)
-- ============================================================
INSERT INTO public.rubric_items (
  id,
  lab_id,
  title,
  description,
  max_points,
  position
) VALUES
(
  'a1a1a1a1-0001-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'Data Collection Accuracy',
  'Measurements are precise, units are correct, and values are internally consistent.',
  25,
  1
),
(
  'a1a1a1a1-0002-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'Density Calculation',
  'Shows correct subtraction and density formula use with correct rounding.',
  25,
  2
),
(
  'a1a1a1a1-0003-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'Scientific Reasoning',
  'Explains whether results are reasonable and references accepted value for water.',
  25,
  3
),
(
  'a1a1a1a1-0004-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'Lab Communication',
  'Responses are clear, complete, and scientifically written.',
  25,
  4
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  max_points = EXCLUDED.max_points,
  position = EXCLUDED.position;

-- ============================================================
-- DRAFT LAB (for lab builder demo)
-- ============================================================
INSERT INTO public.labs (
  id,
  organization_id,
  teacher_id,
  title,
  overview,
  objectives,
  standards,
  materials_list,
  safety_notes,
  background,
  teacher_notes,
  status,
  ai_generated,
  estimated_minutes
) VALUES (
  'cccccccc-0002-0000-0000-000000000001'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'teacher@westlake.demo'),
  'Conservation of Mass',
  'Students observe a reaction in a sealed system and compare total mass before and after mixing to test conservation of mass.',
  ARRAY[
    'Measure total system mass before and after a reaction',
    'Explain why mass is conserved in a closed system',
    'Identify common sources of experimental error in mass measurements'
  ],
  ARRAY[
    'NGSS MS-PS1-5'
  ],
  ARRAY[
    'Small zip-top bag',
    'Calcium chloride solution',
    'Sodium carbonate solution',
    'Digital balance',
    'Paper towels'
  ],
  'Wear splash goggles. Keep liquids away from electrical outlets. Dispose of reaction mixtures as directed by your teacher.',
  'In a closed system, matter is neither created nor destroyed; apparent mass changes are usually due to gas escaping or measurement error.',
  'Draft in progress: add checkpoint prompts and final reflection rubric before publishing.',
  'draft',
  false,
  40
)
ON CONFLICT (id) DO UPDATE
SET
  organization_id = EXCLUDED.organization_id,
  teacher_id = EXCLUDED.teacher_id,
  title = EXCLUDED.title,
  overview = EXCLUDED.overview,
  objectives = EXCLUDED.objectives,
  standards = EXCLUDED.standards,
  materials_list = EXCLUDED.materials_list,
  safety_notes = EXCLUDED.safety_notes,
  background = EXCLUDED.background,
  teacher_notes = EXCLUDED.teacher_notes,
  status = EXCLUDED.status,
  ai_generated = EXCLUDED.ai_generated,
  estimated_minutes = EXCLUDED.estimated_minutes;

-- ============================================================
-- STUDENT LAB RUNS (one run per student, varied states)
-- ============================================================
INSERT INTO public.student_lab_runs (
  id,
  assignment_id,
  student_id,
  lab_id,
  current_step,
  prelab_completed,
  status,
  quick_note,
  started_at,
  completed_at,
  updated_at
) VALUES
(
  '11111111-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  4,
  true,
  'finished_step',
  'Completed with clean data and full calculations.',
  now() - interval '2 days',
  now() - interval '18 hours',
  now() - interval '12 hours'
),
(
  '22222222-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  4,
  true,
  'finished_step',
  'Completed with minor rounding issues.',
  now() - interval '2 days',
  now() - interval '14 hours',
  now() - interval '9 hours'
),
(
  '33333333-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student3@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  3,
  true,
  'on_track',
  'Ready to record beaker + water mass.',
  now() - interval '4 hours',
  null,
  now() - interval '8 minutes'
),
(
  '44444444-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student4@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  2,
  true,
  'stuck',
  'Unsure where to read the meniscus.',
  now() - interval '3 hours',
  null,
  now() - interval '22 minutes'
),
(
  '55555555-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student5@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  2,
  true,
  'need_help',
  'Requested help before measuring volume.',
  now() - interval '2 hours',
  null,
  now() - interval '4 minutes'
),
(
  '66666666-0001-0000-0000-000000000001'::uuid,
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student6@westlake.demo'),
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  0,
  false,
  'on_track',
  'Not started yet.',
  now() - interval '30 minutes',
  null,
  now() - interval '30 minutes'
)
ON CONFLICT (assignment_id, student_id) DO UPDATE
SET
  lab_id = EXCLUDED.lab_id,
  current_step = EXCLUDED.current_step,
  prelab_completed = EXCLUDED.prelab_completed,
  status = EXCLUDED.status,
  quick_note = EXCLUDED.quick_note,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- PRE-LAB RESPONSES (5 students x 2 questions)
-- ============================================================
INSERT INTO public.pre_lab_responses (
  lab_run_id,
  question_id,
  student_id,
  response_text,
  is_valid,
  saved_at
) VALUES
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  'Density = mass/volume. Mass is measured in grams and volume in milliliters, giving density in g/mL.',
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  'Taring sets the current mass to zero so measurements only include what is added afterward.',
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  'Density is the amount of mass in a given volume: D = m/V. Units can be g/mL for liquids.',
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  'You zero the balance so the reading starts at 0.0 for the object you want to measure.',
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student3@westlake.demo' LIMIT 1),
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student3@westlake.demo'),
  'Density compares mass to volume using D = m/V. It helps identify substances.',
  true,
  now() - interval '4 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student3@westlake.demo' LIMIT 1),
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student3@westlake.demo'),
  'Tare removes the container mass from later measurements so values are not inflated.',
  true,
  now() - interval '4 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student4@westlake.demo' LIMIT 1),
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student4@westlake.demo'),
  'Density is mass divided by volume. If mass is in grams and volume is in mL, density is g/mL.',
  true,
  now() - interval '3 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student4@westlake.demo' LIMIT 1),
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student4@westlake.demo'),
  'Taring makes the scale read zero before measurement so you do not count the container mass by accident.',
  true,
  now() - interval '3 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student5@westlake.demo' LIMIT 1),
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student5@westlake.demo'),
  'Density uses D = m/V and tells how tightly packed matter is in a substance.',
  true,
  now() - interval '2 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student5@westlake.demo' LIMIT 1),
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student5@westlake.demo'),
  'Zeroing the balance helps isolate the measurement of the sample, not the equipment.',
  true,
  now() - interval '2 hours'
)
ON CONFLICT (lab_run_id, question_id) DO UPDATE
SET
  student_id = EXCLUDED.student_id,
  response_text = EXCLUDED.response_text,
  is_valid = EXCLUDED.is_valid,
  saved_at = EXCLUDED.saved_at;

-- ============================================================
-- STEP RESPONSES
-- Sam + Jordan: steps 1-4 complete
-- Alex: steps 1-2 complete
-- Maya: step 1 complete (flagged)
-- Ethan: step 1 complete (flagged)
-- ============================================================
INSERT INTO public.step_responses (
  lab_run_id,
  step_id,
  student_id,
  data_values,
  reflection_text,
  flags,
  completed,
  saved_at
) VALUES
-- Sam
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  '{"Mass of empty beaker": "82.4"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'eeeeeeee-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  '{"Volume of water": "102"}'::jsonb,
  'I read from the bottom of the meniscus at eye level.',
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'eeeeeeee-0003-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  '{"Mass of beaker + water": "184.1"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'eeeeeeee-0004-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student1@westlake.demo'),
  '{"Calculated density of water": "1.00"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),

-- Jordan
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  '{"Mass of empty beaker": "81.9"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'eeeeeeee-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  '{"Volume of water": "99"}'::jsonb,
  'Meniscus read from the lowest point of the curve.',
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'eeeeeeee-0003-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  '{"Mass of beaker + water": "181.0"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'eeeeeeee-0004-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student2@westlake.demo'),
  '{"Calculated density of water": "1.00"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '2 days'
),

-- Alex (through step 2)
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student3@westlake.demo' LIMIT 1),
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student3@westlake.demo'),
  '{"Mass of empty beaker": "83.2"}'::jsonb,
  null,
  '[]'::jsonb,
  true,
  now() - interval '3 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student3@westlake.demo' LIMIT 1),
  'eeeeeeee-0002-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student3@westlake.demo'),
  '{"Volume of water": "101"}'::jsonb,
  'Water level looked stable at eye height.',
  '[]'::jsonb,
  true,
  now() - interval '45 minutes'
),

-- Maya (stuck at step 2, only step 1 done)
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student4@westlake.demo' LIMIT 1),
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student4@westlake.demo'),
  '{"Mass of empty beaker": "82.7"}'::jsonb,
  null,
  '[{"field": "Mass of empty beaker", "message": "Measurement repeated with variation greater than expected."}]'::jsonb,
  true,
  now() - interval '2 hours'
),

-- Ethan (needs help at step 2, only step 1 done)
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student5@westlake.demo' LIMIT 1),
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  (SELECT id FROM public.profiles WHERE email = 'student5@westlake.demo'),
  '{"Mass of empty beaker": "84.0"}'::jsonb,
  null,
  '[{"field": "Mass of empty beaker", "message": "Needs teacher check before proceeding."}]'::jsonb,
  true,
  now() - interval '90 minutes'
)
ON CONFLICT (lab_run_id, step_id) DO UPDATE
SET
  student_id = EXCLUDED.student_id,
  data_values = EXCLUDED.data_values,
  reflection_text = EXCLUDED.reflection_text,
  flags = EXCLUDED.flags,
  completed = EXCLUDED.completed,
  saved_at = EXCLUDED.saved_at;

-- ============================================================
-- HELP REQUEST (Ethan, escalated, unresolved)
-- ============================================================
DELETE FROM public.help_requests
WHERE lab_run_id = (
  SELECT slr.id
  FROM public.student_lab_runs slr
  JOIN public.profiles p ON p.id = slr.student_id
  WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid
    AND p.email = 'student5@westlake.demo'
  LIMIT 1
);

INSERT INTO public.help_requests (
  id,
  lab_run_id,
  student_id,
  step_id,
  escalated_to_teacher,
  conversation,
  resolved,
  created_at,
  updated_at
) VALUES (
  '88888888-0001-0000-0000-000000000001'::uuid,
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student5@westlake.demo' LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'student5@westlake.demo'),
  'eeeeeeee-0002-0000-0000-000000000001'::uuid,
  true,
  '[
    {"role":"user","content":"I cannot tell where to read the water level. Is it the top or bottom of the curve?","ts":"2026-04-30T13:15:00Z"},
    {"role":"assistant","content":"Great question. Read the volume at eye level from the bottom of the meniscus, the lowest point of the curve.","ts":"2026-04-30T13:15:20Z"},
    {"role":"user","content":"I tried that, but my partner and I still get different numbers.","ts":"2026-04-30T13:16:10Z"},
    {"role":"assistant","content":"Try this: place the cylinder on a flat desk, crouch so your eyes are level with the markings, and compare again.","ts":"2026-04-30T13:16:32Z"},
    {"role":"user","content":"We are still off by about 3 mL and do not know which one is right.","ts":"2026-04-30T13:17:20Z"},
    {"role":"assistant","content":"You are doing the right checks. This is a good time to ask your teacher for a quick in-person check.","ts":"2026-04-30T13:17:45Z"}
  ]'::jsonb,
  false,
  now() - interval '40 minutes',
  now() - interval '4 minutes'
)
ON CONFLICT (id) DO UPDATE
SET
  lab_run_id = EXCLUDED.lab_run_id,
  student_id = EXCLUDED.student_id,
  step_id = EXCLUDED.step_id,
  escalated_to_teacher = EXCLUDED.escalated_to_teacher,
  conversation = EXCLUDED.conversation,
  resolved = EXCLUDED.resolved,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- STUDENT GRADES (Sam + Jordan)
-- ============================================================
INSERT INTO public.student_grades (
  id,
  lab_run_id,
  teacher_id,
  total_score,
  max_score,
  letter_grade,
  overall_comment,
  graded_at,
  updated_at
) VALUES
(
  '77777777-0001-0000-0000-000000000001'::uuid,
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'teacher@westlake.demo'),
  92,
  100,
  'A',
  'Excellent data quality and clear explanation of methods. Keep checking unit precision.',
  now() - interval '10 hours',
  now() - interval '10 hours'
),
(
  '77777777-0002-0000-0000-000000000001'::uuid,
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'teacher@westlake.demo'),
  87,
  100,
  'B+',
  'Strong work overall. Recheck significant figures in final calculations.',
  now() - interval '8 hours',
  now() - interval '8 hours'
)
ON CONFLICT (lab_run_id) DO UPDATE
SET
  teacher_id = EXCLUDED.teacher_id,
  total_score = EXCLUDED.total_score,
  max_score = EXCLUDED.max_score,
  letter_grade = EXCLUDED.letter_grade,
  overall_comment = EXCLUDED.overall_comment,
  graded_at = EXCLUDED.graded_at,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- RUBRIC SCORES (Sam + Jordan)
-- ============================================================
INSERT INTO public.rubric_scores (
  lab_run_id,
  rubric_item_id,
  teacher_score,
  teacher_comment,
  updated_at
) VALUES
-- Sam: 92/100
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'a1a1a1a1-0001-0000-0000-000000000001'::uuid,
  24,
  'Measurements are consistent and well recorded.',
  now() - interval '10 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'a1a1a1a1-0002-0000-0000-000000000001'::uuid,
  23,
  'Calculation method is correct with minor rounding drift.',
  now() - interval '10 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'a1a1a1a1-0003-0000-0000-000000000001'::uuid,
  22,
  'Reasoning references accepted density and plausible error sources.',
  now() - interval '10 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student1@westlake.demo' LIMIT 1),
  'a1a1a1a1-0004-0000-0000-000000000001'::uuid,
  23,
  'Clear and concise scientific writing.',
  now() - interval '10 hours'
),

-- Jordan: 87/100
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'a1a1a1a1-0001-0000-0000-000000000001'::uuid,
  22,
  'Data is mostly accurate; one measurement needed verification.',
  now() - interval '8 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'a1a1a1a1-0002-0000-0000-000000000001'::uuid,
  22,
  'Correct setup and arithmetic with minor precision loss.',
  now() - interval '8 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'a1a1a1a1-0003-0000-0000-000000000001'::uuid,
  21,
  'Reasoning is good but could cite specific error sources more clearly.',
  now() - interval '8 hours'
),
(
  (SELECT slr.id FROM public.student_lab_runs slr JOIN public.profiles p ON p.id = slr.student_id WHERE slr.assignment_id = 'ffffffff-0001-0000-0000-000000000001'::uuid AND p.email = 'student2@westlake.demo' LIMIT 1),
  'a1a1a1a1-0004-0000-0000-000000000001'::uuid,
  22,
  'Communication is clear with minor omissions.',
  now() - interval '8 hours'
)
ON CONFLICT (lab_run_id, rubric_item_id) DO UPDATE
SET
  teacher_score = EXCLUDED.teacher_score,
  teacher_comment = EXCLUDED.teacher_comment,
  updated_at = EXCLUDED.updated_at;

COMMIT;
