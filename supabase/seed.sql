-- ============================================================
-- Static seed data
-- Run AFTER migrations via Supabase SQL editor.
-- Note: User creation requires the seed-users.ts script first to get UUIDs.
-- ============================================================

-- Demo organization
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color, footer_text)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'Westlake Science Academy',
  'westlake',
  '#2563EB',
  '#7C3AED',
  'Science Lab Platform powered by LabFlow'
) ON CONFLICT (id) DO NOTHING;

-- Feature flags for demo org (all enabled)
INSERT INTO public.feature_flags (organization_id, flag_key, enabled) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'ai_lab_generation', true),
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'help_chat',         true),
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'analytics',         true)
ON CONFLICT (organization_id, flag_key) DO NOTHING;

-- NOTE: After running seed-users.ts to create auth users,
-- the handle_new_user trigger will auto-create profiles.
-- Then run seed-data.sql to add classes, labs, enrollments, and assignments.
--
-- DEMO LAB (defined in seed-data.sql):
--   "Measuring the Density of Water"
--   - 4 procedural steps with data entry fields
--   - 2 pre-lab questions (short_answer)
--   - Published status, ai_generated=false
--   - Assigned to Period 3 — Earth Science (Taylor Teacher)
--   - Enrolled: student1@westlake.demo, student2@westlake.demo
--
-- See seed-data.sql for full SQL. Replace TEACHER_ID_PLACEHOLDER,
-- STUDENT1_ID_PLACEHOLDER, STUDENT2_ID_PLACEHOLDER with values from
-- supabase/seed-ids.json (written by seed-users.ts).
