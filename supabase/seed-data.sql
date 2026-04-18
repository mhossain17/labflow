-- ============================================================
-- Demo data seed
-- Run AFTER:
--   1. supabase db push (migrations)
--   2. supabase/seed.sql (org + feature flags)
--   3. npx ts-node --project tsconfig.json supabase/seed-users.ts (creates auth users + writes seed-ids.json)
--
-- Before running this file, replace the four UUID placeholders below
-- with the values from supabase/seed-ids.json (written by seed-users.ts).
--
-- Replace these UUIDs with actual values from supabase/seed-ids.json:
--   TEACHER_ID   → value of "teacher" key
--   STUDENT1_ID  → value of "student1@westlake.demo" key
--   STUDENT2_ID  → value of "student2@westlake.demo" key
--
-- Example sed substitution (macOS):
--   TEACHER=$(jq -r '.teacher' supabase/seed-ids.json)
--   S1=$(jq -r '.["student1@westlake.demo"]' supabase/seed-ids.json)
--   S2=$(jq -r '.["student2@westlake.demo"]' supabase/seed-ids.json)
--   sed -e "s/TEACHER_ID_PLACEHOLDER/$TEACHER/g" \
--       -e "s/STUDENT1_ID_PLACEHOLDER/$S1/g"     \
--       -e "s/STUDENT2_ID_PLACEHOLDER/$S2/g"     \
--       supabase/seed-data.sql | supabase db query
-- ============================================================

-- Fixed UUIDs for demo entities (stable across re-seeds)
-- Class, Lab, Steps, Questions, Assignment all use deterministic UUIDs.

-- ============================================================
-- DEMO CLASS
-- ============================================================
INSERT INTO public.classes (
  id,
  organization_id,
  teacher_id,
  name,
  description,
  period,
  school_year,
  archived
) VALUES (
  'bbbbbbbb-0001-0000-0000-000000000001'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'TEACHER_ID_PLACEHOLDER'::uuid,
  'Period 3 — Earth Science',
  'Introductory Earth Science for 8th graders. Focus on physical and chemical properties of matter.',
  '3',
  '2025-2026',
  false
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO LAB: Measuring the Density of Water
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
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'TEACHER_ID_PLACEHOLDER'::uuid,
  'Measuring the Density of Water',
  'In this lab, students will use a triple-beam balance and a graduated cylinder to measure the mass and volume of water samples, then calculate density. Students will compare their experimental value to the accepted value of 1.00 g/mL and evaluate sources of error.',
  ARRAY[
    'Measure mass using a triple-beam balance with an accuracy of ±0.1 g',
    'Measure liquid volume using a graduated cylinder with an accuracy of ±1 mL',
    'Calculate density using the formula D = m/V',
    'Compare experimental results to accepted values and calculate percent error',
    'Identify and explain potential sources of experimental error'
  ],
  ARRAY[
    'NGSS MS-PS1-2',
    'NGSS MS-ETS1-4'
  ],
  ARRAY[
    'Triple-beam balance or digital scale (±0.1 g)',
    '100 mL graduated cylinder',
    '250 mL beaker',
    'Distilled water (approximately 150 mL)',
    'Wash bottle',
    'Lab notebook or data sheet',
    'Calculator'
  ],
  'Water spills can make the floor slippery — wipe up immediately. Do not use glassware that is chipped or cracked. Report any broken glass to the teacher immediately. Do not drink the water in the lab.',
  'Density is defined as mass per unit volume (D = m/V). Pure water at 4°C has a density of exactly 1.000 g/mL. At room temperature (~25°C), the accepted density of water is 0.997 g/mL — so results very close to 1.00 g/mL are expected. Density is an intensive physical property, meaning it does not change with sample size, making it useful for identifying substances.',
  'Remind students to zero (tare) the balance before each measurement. Common errors: reading the meniscus from the top rather than the bottom, not re-zeroing after placing the beaker, and calculating mass of water incorrectly (forgetting to subtract the beaker mass). A good result is within 5% of 1.00 g/mL.',
  'published',
  false,
  45
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRE-LAB QUESTIONS
-- ============================================================
INSERT INTO public.pre_lab_questions (
  id,
  lab_id,
  position,
  question_text,
  question_type,
  required
) VALUES
(
  'dddddddd-0001-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  1,
  'What is the formula for density? Define each variable and give its SI unit.',
  'short_answer',
  true
),
(
  'dddddddd-0002-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  2,
  'Explain what it means to "zero" or "tare" a balance before taking a measurement. Why is this step important?',
  'short_answer',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LAB STEPS
-- ============================================================

-- Step 1: Mass of Empty Beaker
INSERT INTO public.lab_steps (
  id,
  lab_id,
  step_number,
  title,
  instructions,
  checkpoint,
  data_entry_fields,
  reflection_prompt,
  troubleshooting
) VALUES (
  'eeeeeeee-0001-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  1,
  'Mass of Empty Beaker',
  'Place the clean, dry 250 mL beaker on the triple-beam balance. Zero/tare the balance with the beaker in place, or record the mass of the empty beaker before adding water. Adjust the riders until the balance beam is level, then record the mass.',
  'Check: Is your beaker completely dry? Even a few drops of water will change your mass reading. Pat the beaker dry with a paper towel if needed, then wait 30 seconds before measuring.',
  '[{"label": "Mass of empty beaker", "type": "number", "unit": "g", "min": 0, "max": 500, "required": true, "placeholder": "e.g. 82.4"}]'::jsonb,
  null,
  'If the balance will not balance (rider all the way to the right and beam still tips down), the beaker may be too heavy for the scale range — ask your teacher for a different beaker. If the reading fluctuates, make sure the balance is on a level, stable surface.'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Add Water and Record Volume
INSERT INTO public.lab_steps (
  id,
  lab_id,
  step_number,
  title,
  instructions,
  checkpoint,
  data_entry_fields,
  reflection_prompt,
  troubleshooting
) VALUES (
  'eeeeeeee-0002-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  2,
  'Add Water and Record Volume',
  'Use the wash bottle or a beaker to carefully add approximately 100 mL of distilled water to the graduated cylinder. Hold the graduated cylinder at eye level and read the volume at the BOTTOM of the meniscus (the curved surface of the water). Record the exact volume to the nearest 1 mL.',
  null,
  '[{"label": "Volume of water", "type": "number", "unit": "mL", "min": 0, "max": 250, "required": true, "placeholder": "e.g. 102"}]'::jsonb,
  'After recording the volume in the graduated cylinder, pour the water into the beaker you massed in Step 1. Describe what happens to the water surface (the meniscus) and explain why you read from the bottom of the curve.',
  'If you added too much water and went over 100 mL, that is okay — record whatever volume you actually have. Do NOT pour water out; the exact amount does not matter as long as you record it accurately. If you are unsure which graduation lines to read, each small line on a 100 mL cylinder typically represents 1 mL or 2 mL — count from a labeled line.'
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Mass of Beaker + Water
INSERT INTO public.lab_steps (
  id,
  lab_id,
  step_number,
  title,
  instructions,
  checkpoint,
  data_entry_fields,
  reflection_prompt,
  troubleshooting
) VALUES (
  'eeeeeeee-0003-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  3,
  'Mass of Beaker + Water',
  'Place the beaker containing your water sample on the triple-beam balance. Move the riders to find the total mass of the beaker plus water. Make sure the balance beam is level before recording. Record the combined mass.',
  'IMPORTANT: Do NOT re-zero/tare the balance for this step. You need the actual combined mass of beaker + water, not just the water alone. The scale should NOT be zeroed here — you will subtract the beaker mass in Step 4.',
  '[{"label": "Mass of beaker + water", "type": "number", "unit": "g", "min": 0, "max": 500, "required": true, "placeholder": "e.g. 184.6"}]'::jsonb,
  null,
  'If your beaker + water mass is LESS than your empty beaker mass from Step 1, something went wrong — either you re-zeroed the balance (which you should not do for this step), or you recorded the wrong value. Check your Step 1 reading and measure again carefully.'
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Calculate and Record Density
INSERT INTO public.lab_steps (
  id,
  lab_id,
  step_number,
  title,
  instructions,
  checkpoint,
  data_entry_fields,
  reflection_prompt,
  troubleshooting
) VALUES (
  'eeeeeeee-0004-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  4,
  'Calculate and Record Density',
  'Calculate the mass of water alone: Mass of water = (Mass of beaker + water) − (Mass of empty beaker). Then calculate density: Density = Mass of water ÷ Volume of water. Express your answer in g/mL rounded to two decimal places. Record your calculated density below.',
  null,
  '[{"label": "Calculated density of water", "type": "number", "unit": "g/mL", "min": 0, "max": 2, "required": true, "placeholder": "e.g. 1.00"}]'::jsonb,
  null,
  'Expected result: your density should be between 0.90 and 1.10 g/mL. The accepted value for water at room temperature is approximately 0.997 g/mL (often rounded to 1.00 g/mL). If your result is outside 0.90–1.10: (1) Check your subtraction — did you subtract the beaker mass correctly? (2) Check units — mass must be in grams, volume in mL. (3) Re-examine your measurements from Steps 1–3 for transcription errors. A result of exactly 1.00 is fine — do not assume you made an error.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LAB ASSIGNMENT (lab → demo class)
-- ============================================================
INSERT INTO public.lab_assignments (
  id,
  lab_id,
  class_id,
  assigned_by,
  due_date,
  instructions_override
) VALUES (
  'ffffffff-0001-0000-0000-000000000001'::uuid,
  'cccccccc-0001-0000-0000-000000000001'::uuid,
  'bbbbbbbb-0001-0000-0000-000000000001'::uuid,
  'TEACHER_ID_PLACEHOLDER'::uuid,
  (CURRENT_DATE + INTERVAL '7 days')::date,
  null
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLASS ENROLLMENTS (students → demo class)
-- ============================================================
INSERT INTO public.class_enrollments (
  class_id,
  student_id
) VALUES
(
  'bbbbbbbb-0001-0000-0000-000000000001'::uuid,
  'STUDENT1_ID_PLACEHOLDER'::uuid
),
(
  'bbbbbbbb-0001-0000-0000-000000000001'::uuid,
  'STUDENT2_ID_PLACEHOLDER'::uuid
)
ON CONFLICT (class_id, student_id) DO NOTHING;
