#!/usr/bin/env node
/**
 * LabFlow — Rich demo data seed
 * Run AFTER seed-all.mjs to populate realistic multi-class, multi-lab, multi-student data.
 *
 *   node supabase/seed-demo.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = [resolve(__dirname, '../.env.local'), resolve(__dirname, '../.env')]
  .find(p => { try { readFileSync(p); return true } catch { return false } })
if (!envPath) { console.error('No .env.local or .env found'); process.exit(1) }
const env = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const idx = trimmed.indexOf('=')
  if (idx < 0) return
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
})

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function step(label, fn) {
  process.stdout.write(`  ${label}... `)
  try { const result = await fn(); console.log('✓'); return result }
  catch (err) { console.log('✗\n   ', err.message); throw err }
}

// ─── Fixed IDs ────────────────────────────────────────────────
const ORG_ID        = 'aaaaaaaa-0000-0000-0000-000000000001'
const TEACHER_ID_PH = 'TEACHER_PLACEHOLDER' // resolved at runtime

// Classes
const CLASS1_ID     = 'bbbbbbbb-0001-0000-0000-000000000001' // Period 3 Earth Science (existing)
const CLASS2_ID     = 'bbbbbbbb-0002-0000-0000-000000000001' // Period 1 Biology
const CLASS3_ID     = 'bbbbbbbb-0003-0000-0000-000000000001' // Period 5 Chemistry

// Labs
const LAB1_ID       = 'cccccccc-0001-0000-0000-000000000001' // Density (existing)
const LAB2_ID       = 'cccccccc-0002-0000-0000-000000000001' // Chromatography
const LAB3_ID       = 'cccccccc-0003-0000-0000-000000000001' // pH Indicators
const LAB4_ID       = 'cccccccc-0004-0000-0000-000000000001' // Photosynthesis (draft)

// Pre-lab questions
const LAB2_Q1       = 'dddddddd-0003-0000-0000-000000000001'
const LAB2_Q2       = 'dddddddd-0004-0000-0000-000000000001'
const LAB3_Q1       = 'dddddddd-0005-0000-0000-000000000001'
const LAB3_Q2       = 'dddddddd-0006-0000-0000-000000000001'

// Lab steps
const LAB2_S1       = 'eeeeeeee-0005-0000-0000-000000000001'
const LAB2_S2       = 'eeeeeeee-0006-0000-0000-000000000001'
const LAB2_S3       = 'eeeeeeee-0007-0000-0000-000000000001'
const LAB2_S4       = 'eeeeeeee-0008-0000-0000-000000000001'
const LAB3_S1       = 'eeeeeeee-0009-0000-0000-000000000001'
const LAB3_S2       = 'eeeeeeee-0010-0000-0000-000000000001'
const LAB3_S3       = 'eeeeeeee-0011-0000-0000-000000000001'

// Assignments
const ASSIGN1_ID    = 'ffffffff-0001-0000-0000-000000000001' // Density → Class1 (existing)
const ASSIGN2_ID    = 'ffffffff-0002-0000-0000-000000000001' // Chroma → Class2
const ASSIGN3_ID    = 'ffffffff-0003-0000-0000-000000000001' // pH → Class3
const ASSIGN4_ID    = 'ffffffff-0004-0000-0000-000000000001' // Chroma → Class1

// Lab runs
const RUN_S1_A1     = '11111111-0001-0000-0000-000000000001' // Sam,  Density (completed)
const RUN_S2_A1     = '11111111-0002-0000-0000-000000000001' // Jordan, Density (stuck step 2)
const RUN_S3_A1     = '11111111-0003-0000-0000-000000000001' // Alex, Density (need help step 3)
const RUN_S4_A1     = '11111111-0004-0000-0000-000000000001' // Maya, Density (pre-lab only)
const RUN_S5_A1     = '11111111-0005-0000-0000-000000000001' // Ethan, Density (on track step 1)
const RUN_S6_A1     = '11111111-0006-0000-0000-000000000001' // Sofia, Density (finished step 2)

const RUN_S3_A2     = '11111111-0007-0000-0000-000000000001' // Alex, Chroma/Bio (on track step 1)
const RUN_S5_A2     = '11111111-0008-0000-0000-000000000001' // Ethan, Chroma/Bio (waiting check)

const RUN_S4_A3     = '11111111-0009-0000-0000-000000000001' // Maya, pH/Chem (completed)
const RUN_S6_A3     = '11111111-0010-0000-0000-000000000001' // Sofia, pH/Chem (need help step 2)

// Existing question/step IDs from seed-all.mjs
const LAB1_Q1       = 'dddddddd-0001-0000-0000-000000000001'
const LAB1_Q2       = 'dddddddd-0002-0000-0000-000000000001'
const LAB1_S1       = 'eeeeeeee-0001-0000-0000-000000000001'
const LAB1_S2       = 'eeeeeeee-0002-0000-0000-000000000001'
const LAB1_S3       = 'eeeeeeee-0003-0000-0000-000000000001'
const LAB1_S4       = 'eeeeeeee-0004-0000-0000-000000000001'

// ─── Helpers ──────────────────────────────────────────────────
async function upsertUser({ email, password, role, first_name, last_name }) {
  const { data: listData } = await supabase.auth.admin.listUsers()
  const existing = listData?.users?.find(u => u.email === email)
  let userId
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { app_metadata: { role } })
    userId = existing.id
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { organization_id: ORG_ID, role, first_name, last_name },
      app_metadata: { role }
    })
    if (error) throw error
    userId = data.user.id
  }
  const { error: pe } = await supabase.from('profiles').upsert(
    { id: userId, organization_id: ORG_ID, role, first_name, last_name, avatar_url: null },
    { onConflict: 'id' }
  )
  if (pe) throw pe
  return userId
}

function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]
}
function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString()
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 LabFlow Demo Data Seed\n')

  // ── Step 1: extra users ──
  console.log('Step 1: Extra demo users')
  const teacherId = await step('Fetch teacher ID', async () => {
    const { data } = await supabase.auth.admin.listUsers()
    const t = data?.users?.find(u => u.email === 'teacher@westlake.demo')
    if (!t) throw new Error('teacher@westlake.demo not found — run seed-all.mjs first')
    return t.id
  })
  const s1Id = await step('student1 (Sam)', () => upsertUser({ email: 'student1@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Sam', last_name: 'Student' }))
  const s2Id = await step('student2 (Jordan)', () => upsertUser({ email: 'student2@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Jordan', last_name: 'Learner' }))
  const s3Id = await step('student3 (Alex)', () => upsertUser({ email: 'student3@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Alex', last_name: 'Chen' }))
  const s4Id = await step('student4 (Maya)', () => upsertUser({ email: 'student4@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Maya', last_name: 'Rodriguez' }))
  const s5Id = await step('student5 (Ethan)', () => upsertUser({ email: 'student5@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Ethan', last_name: 'Park' }))
  const s6Id = await step('student6 (Sofia)', () => upsertUser({ email: 'student6@westlake.demo', password: 'LabFlow2025!', role: 'student', first_name: 'Sofia', last_name: 'Williams' }))

  // ── Step 2: classes ──
  console.log('\nStep 2: Classes')
  await step('Period 1 — Biology', async () => {
    const { error } = await supabase.from('classes').upsert({
      id: CLASS2_ID, organization_id: ORG_ID, teacher_id: teacherId,
      name: 'Period 1 — Biology', description: 'Introductory Biology for 7th graders.',
      period: '1', school_year: '2025-2026', archived: false
    }, { onConflict: 'id' })
    if (error) throw error
  })
  await step('Period 5 — Chemistry', async () => {
    const { error } = await supabase.from('classes').upsert({
      id: CLASS3_ID, organization_id: ORG_ID, teacher_id: teacherId,
      name: 'Period 5 — Chemistry', description: 'Intro Chemistry for 9th graders.',
      period: '5', school_year: '2025-2026', archived: false
    }, { onConflict: 'id' })
    if (error) throw error
  })
  await step('Teacher class memberships', async () => {
    const rows = [CLASS1_ID, CLASS2_ID, CLASS3_ID].map((classId) => ({
      class_id: classId,
      teacher_id: teacherId,
      class_role: 'lead_teacher',
      can_manage_roster: true,
      can_manage_assignments: true,
      can_manage_grades: true,
      can_edit_class_settings: true,
      added_by: teacherId,
    }))
    const { error } = await supabase.from('class_teachers').upsert(rows, { onConflict: 'class_id,teacher_id' })
    if (error) throw error
  })

  // ── Step 3: enrollments ──
  console.log('\nStep 3: Enrollments')
  // CLASS1 enrollments were already done by seed-all.mjs — only add new classes here
  const enrollments = [
    // Period 1 Biology
    { class_id: CLASS2_ID, student_id: s3Id, status: 'active' },
    { class_id: CLASS2_ID, student_id: s5Id, status: 'active' },
    // Period 5 Chemistry
    { class_id: CLASS3_ID, student_id: s4Id, status: 'active' },
    { class_id: CLASS3_ID, student_id: s6Id, status: 'active' },
  ]
  await step('All enrollments', async () => {
    // Delete any stale rows first so this script is re-runnable
    await supabase.from('class_enrollments').delete().in('class_id', [CLASS2_ID, CLASS3_ID])
    const { error } = await supabase.from('class_enrollments').insert(enrollments)
    if (error) throw error
  })

  // ── Step 4: labs ──
  console.log('\nStep 4: Labs')
  await step('Chromatography (published)', async () => {
    const { error } = await supabase.from('labs').upsert({
      id: LAB2_ID, organization_id: ORG_ID, teacher_id: teacherId,
      title: 'Paper Chromatography: Separating Pigments',
      overview: 'Students use paper chromatography to separate the pigments in washable markers, discovering that colors we see are often mixtures of multiple dyes.',
      objectives: [
        'Explain how chromatography separates mixtures based on solubility and polarity',
        'Measure Rf values for at least two pigments',
        'Identify which marker colors contain multiple pigment components',
        'Relate chromatography to real-world applications in forensics and food science'
      ],
      standards: ['NGSS MS-PS1-2', 'NGSS MS-PS1-4'],
      materials_list: ['Coffee filter paper strips (2 cm × 15 cm)', 'Washable markers (black, brown, purple)', '250 mL beakers (one per group)', 'Distilled water (solvent)', 'Pencil (for marking baseline)', 'Ruler', 'Tape'],
      safety_notes: 'Use only washable, non-toxic markers. Keep water away from electrical equipment.',
      background: 'Chromatography separates mixtures by exploiting differences in how strongly components adhere to a stationary phase vs. dissolve in a moving solvent. The Rf value = (distance traveled by pigment) / (distance traveled by solvent front).',
      teacher_notes: 'Black markers work best for dramatic separation. Allow solvent to travel at least 10 cm before stopping. Pre-cut filter strips the day before saves time.',
      status: 'published', ai_generated: false, estimated_minutes: 40
    }, { onConflict: 'id' })
    if (error) throw error
  })

  await step('pH & Acid-Base Indicators (published)', async () => {
    const { error } = await supabase.from('labs').upsert({
      id: LAB3_ID, organization_id: ORG_ID, teacher_id: teacherId,
      title: 'pH and Acid-Base Indicators',
      overview: 'Students prepare red cabbage juice as a natural pH indicator and use it to classify common household solutions as acids, bases, or neutral substances.',
      objectives: [
        'Define pH and explain the pH scale (0–14)',
        'Prepare a natural pH indicator from red cabbage',
        'Classify solutions as acidic, basic, or neutral based on color change',
        'Order solutions by relative pH and compare to reference values'
      ],
      standards: ['NGSS MS-PS1-2', 'NGSS HS-PS1-7'],
      materials_list: ['Red cabbage (1/4 head)', 'Boiling water', 'Strainer', '6 small cups or test tubes', 'Distilled water', 'White vinegar', 'Lemon juice', 'Baking soda solution (1 tsp per cup water)', 'Milk', 'Ammonia cleaner (diluted)', 'pH reference chart'],
      safety_notes: 'Diluted ammonia has a strong odor — ensure good ventilation. Do not mix chemicals beyond the specified solutions. Wash hands after handling all solutions.',
      background: 'pH measures hydrogen ion concentration on a logarithmic scale. Anthocyanins in red cabbage change color from red (acidic) through purple (neutral) to green/yellow (basic), making it an effective natural indicator.',
      teacher_notes: 'Prepare cabbage juice 1 day ahead for best results. Baking soda solution should be freshly made. The color changes are most vivid with concentrated indicator.',
      status: 'published', ai_generated: true, estimated_minutes: 50
    }, { onConflict: 'id' })
    if (error) throw error
  })

  await step('Photosynthesis Rate (draft)', async () => {
    const { error } = await supabase.from('labs').upsert({
      id: LAB4_ID, organization_id: ORG_ID, teacher_id: teacherId,
      title: 'Measuring the Rate of Photosynthesis',
      overview: 'Students use the floating leaf disk assay to measure how light intensity affects the rate of photosynthesis in spinach leaves.',
      objectives: [
        'Describe the floating leaf disk assay method',
        'Control variables in an experiment testing light intensity',
        'Graph rate of photosynthesis vs. light intensity',
        'Explain why the rate of photosynthesis changes with light'
      ],
      standards: ['NGSS HS-LS1-5', 'NGSS HS-LS2-5'],
      materials_list: ['Fresh spinach leaves', 'Baking soda (0.2 g)', 'Liquid dish soap (1 drop)', 'Plastic syringe (10 mL)', 'Lamp with adjustable distance', 'Timer', '250 mL beakers', 'Hole punch'],
      safety_notes: 'Scissors are sharp — handle carefully. Do not look directly into the lamp.',
      background: 'Photosynthesis converts CO₂ and water into glucose using light energy. The floating disk assay tracks O₂ production as a proxy for photosynthetic rate.',
      teacher_notes: 'Still refining the data entry fields. Hold as draft until protocol is finalized.',
      status: 'draft', ai_generated: false, estimated_minutes: 60
    }, { onConflict: 'id' })
    if (error) throw error
  })

  // ── Step 5: pre-lab questions ──
  console.log('\nStep 5: Pre-lab questions')
  await step('Chromatography questions', async () => {
    const { error } = await supabase.from('pre_lab_questions').upsert([
      { id: LAB2_Q1, lab_id: LAB2_ID, position: 1, question_text: 'What is chromatography? In one or two sentences, explain how the technique separates the components of a mixture.', question_type: 'short_answer', required: true },
      { id: LAB2_Q2, lab_id: LAB2_ID, position: 2, question_text: 'Write the formula for calculating the Rf value of a pigment. What does an Rf value close to 1.0 tell you about how that pigment interacts with the solvent?', question_type: 'short_answer', required: true }
    ], { onConflict: 'id' })
    if (error) throw error
  })
  await step('pH Indicators questions', async () => {
    const { error } = await supabase.from('pre_lab_questions').upsert([
      { id: LAB3_Q1, lab_id: LAB3_ID, position: 1, question_text: 'What does pH measure? Describe where acids, bases, and neutral substances fall on the 0–14 pH scale.', question_type: 'short_answer', required: true },
      { id: LAB3_Q2, lab_id: LAB3_ID, position: 2, question_text: 'What is an acid-base indicator? Predict what color the red cabbage indicator might turn in a very acidic solution versus a very basic solution.', question_type: 'short_answer', required: true }
    ], { onConflict: 'id' })
    if (error) throw error
  })

  // ── Step 6: lab steps ──
  console.log('\nStep 6: Lab steps')
  await step('Chromatography steps', async () => {
    const { error } = await supabase.from('lab_steps').upsert([
      {
        id: LAB2_S1, lab_id: LAB2_ID, step_number: 1,
        title: 'Prepare the Filter Paper',
        instructions: 'Using a pencil (not pen), draw a light line 2 cm from the bottom of your filter paper strip. This is the baseline. Use a marker to make a small dot (about 3 mm wide) on the baseline at the center. Press firmly and repeat 3–4 times to build up pigment concentration. Label the top of the strip with the marker color.',
        checkpoint: 'Check: Is your dot small and concentrated? A large smeared dot will give poor separation. Re-do if necessary.',
        data_entry_fields: [{ label: 'Marker color tested', type: 'text', required: true }],
        reflection_prompt: null,
        troubleshooting: 'If your dot is too large, let it dry completely and add more ink directly on top rather than spreading outward.'
      },
      {
        id: LAB2_S2, lab_id: LAB2_ID, step_number: 2,
        title: 'Run the Chromatography',
        instructions: 'Add distilled water to your beaker to a depth of about 1 cm. Carefully lower your filter strip into the beaker so that ONLY the very bottom edge touches the water — the baseline dot must be ABOVE the water line. Lean the top of the strip against the beaker rim. Watch as the solvent front travels up the strip. Stop when the solvent front is 1–2 cm from the top.',
        checkpoint: 'CRITICAL: The baseline dot must be above the water surface. If the dot touches the water, the pigments will wash off instead of separating.',
        data_entry_fields: [
          { label: 'Total distance solvent traveled (cm)', type: 'number', unit: 'cm', min: 1, max: 20, required: true },
          { label: 'Time elapsed (minutes)', type: 'number', unit: 'min', min: 1, max: 30, required: true }
        ],
        reflection_prompt: 'Describe what you observed happening to the ink dot as the water moved up the paper. Did you see any separation?',
        troubleshooting: 'If nothing is moving after 5 minutes, check that the strip is touching the water. If all pigment moved to the top, too much water was added.'
      },
      {
        id: LAB2_S3, lab_id: LAB2_ID, step_number: 3,
        title: 'Mark and Measure Pigment Bands',
        instructions: 'Remove the strip from the beaker immediately and use a pencil to mark the leading edge of each pigment band before they fade. Mark the solvent front as well. Measure from the baseline to the center of each pigment band, and from the baseline to the solvent front.',
        checkpoint: null,
        data_entry_fields: [
          { label: 'Distance — Pigment Band 1 (cm)', type: 'number', unit: 'cm', min: 0, max: 20, required: true },
          { label: 'Distance — Pigment Band 2 (cm)', type: 'number', unit: 'cm', min: 0, max: 20, required: false },
          { label: 'Distance — Pigment Band 3 (cm)', type: 'number', unit: 'cm', min: 0, max: 20, required: false }
        ],
        reflection_prompt: 'How many distinct pigment bands did you observe? Were you surprised by how many colors were hidden in the ink?',
        troubleshooting: 'Bands that overlap or are very faint may indicate too little pigment on the baseline dot. Note them as best you can.'
      },
      {
        id: LAB2_S4, lab_id: LAB2_ID, step_number: 4,
        title: 'Calculate Rf Values',
        instructions: 'For each pigment band, calculate its Rf value using: Rf = (distance pigment traveled) ÷ (distance solvent front traveled). Record each value rounded to two decimal places.',
        checkpoint: null,
        data_entry_fields: [
          { label: 'Rf — Pigment Band 1', type: 'number', unit: '', min: 0, max: 1, required: true },
          { label: 'Rf — Pigment Band 2', type: 'number', unit: '', min: 0, max: 1, required: false },
          { label: 'Rf — Pigment Band 3', type: 'number', unit: '', min: 0, max: 1, required: false }
        ],
        reflection_prompt: null,
        troubleshooting: 'Rf values must be between 0 and 1. If you get a value greater than 1, you have likely mixed up which measurement goes on top vs. bottom of the fraction.'
      }
    ], { onConflict: 'id' })
    if (error) throw error
  })

  await step('pH Indicators steps', async () => {
    const { error } = await supabase.from('lab_steps').upsert([
      {
        id: LAB3_S1, lab_id: LAB3_ID, step_number: 1,
        title: 'Prepare Test Samples',
        instructions: 'Label 6 cups: Water, Vinegar, Lemon Juice, Baking Soda Solution, Milk, and Ammonia (diluted). Pour approximately 20 mL of each solution into its labeled cup. Before adding indicator, record your prediction for each solution\'s pH category (acid/neutral/base).',
        checkpoint: 'Make sure cups are clearly labeled to avoid confusion later.',
        data_entry_fields: [
          { label: 'Predicted pH category — Water', type: 'text', required: true },
          { label: 'Predicted pH category — Vinegar', type: 'text', required: true },
          { label: 'Predicted pH category — Lemon Juice', type: 'text', required: true },
          { label: 'Predicted pH category — Baking Soda', type: 'text', required: true },
          { label: 'Predicted pH category — Milk', type: 'text', required: true },
          { label: 'Predicted pH category — Ammonia', type: 'text', required: true }
        ],
        reflection_prompt: null,
        troubleshooting: null
      },
      {
        id: LAB3_S2, lab_id: LAB3_ID, step_number: 2,
        title: 'Add Indicator and Record Colors',
        instructions: 'Add 5 mL of red cabbage indicator to each cup. Stir gently. Wait 30 seconds, then record the exact color observed in each cup. Use descriptive color names (e.g., "bright pink", "pale purple", "blue-green").',
        checkpoint: null,
        data_entry_fields: [
          { label: 'Color — Water', type: 'text', required: true },
          { label: 'Color — Vinegar', type: 'text', required: true },
          { label: 'Color — Lemon Juice', type: 'text', required: true },
          { label: 'Color — Baking Soda', type: 'text', required: true },
          { label: 'Color — Milk', type: 'text', required: true },
          { label: 'Color — Ammonia', type: 'text', required: true }
        ],
        reflection_prompt: 'Compare the color spectrum you observed across all 6 solutions. Which two solutions produced the most dramatically different colors?',
        troubleshooting: 'If all solutions look the same color, the indicator may be too diluted. Ask your teacher for a fresh batch of concentrated cabbage juice.'
      },
      {
        id: LAB3_S3, lab_id: LAB3_ID, step_number: 3,
        title: 'Classify and Rank Solutions',
        instructions: 'Using your color observations and the reference pH-color chart, classify each solution as Acid (pH < 7), Neutral (pH ≈ 7), or Base (pH > 7). Then rank all 6 solutions from most acidic (rank 1) to most basic (rank 6).',
        checkpoint: null,
        data_entry_fields: [
          { label: 'Classification — Water', type: 'text', required: true },
          { label: 'Classification — Vinegar', type: 'text', required: true },
          { label: 'Classification — Lemon Juice', type: 'text', required: true },
          { label: 'Classification — Baking Soda', type: 'text', required: true },
          { label: 'Classification — Milk', type: 'text', required: true },
          { label: 'Classification — Ammonia', type: 'text', required: true },
          { label: 'Rank (1=most acidic → 6=most basic)', type: 'text', required: true }
        ],
        reflection_prompt: 'How accurate were your initial predictions? Which solution surprised you the most and why?',
        troubleshooting: null
      }
    ], { onConflict: 'id' })
    if (error) throw error
  })

  // ── Step 7: assignments ──
  console.log('\nStep 7: Lab assignments')
  await step('Chromatography → Period 1 Biology', async () => {
    const { error } = await supabase.from('lab_assignments').upsert({
      id: ASSIGN2_ID, lab_id: LAB2_ID, class_id: CLASS2_ID,
      assigned_by: teacherId, due_date: daysFromNow(5), instructions_override: null
    }, { onConflict: 'id' })
    if (error) throw error
  })
  await step('pH Lab → Period 5 Chemistry', async () => {
    const { error } = await supabase.from('lab_assignments').upsert({
      id: ASSIGN3_ID, lab_id: LAB3_ID, class_id: CLASS3_ID,
      assigned_by: teacherId, due_date: daysFromNow(3), instructions_override: null
    }, { onConflict: 'id' })
    if (error) throw error
  })
  await step('Chromatography → Period 3 Earth Science', async () => {
    const { error } = await supabase.from('lab_assignments').upsert({
      id: ASSIGN4_ID, lab_id: LAB2_ID, class_id: CLASS1_ID,
      assigned_by: teacherId, due_date: daysFromNow(10), instructions_override: null
    }, { onConflict: 'id' })
    if (error) throw error
  })

  // ── Step 8: student lab runs ──
  console.log('\nStep 8: Student lab runs')
  const runs = [
    // Assignment 1 — Density, Period 3 (6 students, varied progress)
    { id: RUN_S1_A1, assignment_id: ASSIGN1_ID, student_id: s1Id, lab_id: LAB1_ID, current_step: 4, prelab_completed: true, status: 'on_track', quick_note: null, started_at: hoursAgo(48), completed_at: hoursAgo(24) },
    { id: RUN_S2_A1, assignment_id: ASSIGN1_ID, student_id: s2Id, lab_id: LAB1_ID, current_step: 2, prelab_completed: true, status: 'stuck', quick_note: 'My balance keeps rocking and I can\'t get a stable reading', started_at: hoursAgo(6), completed_at: null },
    { id: RUN_S3_A1, assignment_id: ASSIGN1_ID, student_id: s3Id, lab_id: LAB1_ID, current_step: 3, prelab_completed: true, status: 'need_help', quick_note: null, started_at: hoursAgo(5), completed_at: null },
    { id: RUN_S4_A1, assignment_id: ASSIGN1_ID, student_id: s4Id, lab_id: LAB1_ID, current_step: 0, prelab_completed: false, status: 'on_track', quick_note: null, started_at: hoursAgo(1), completed_at: null },
    { id: RUN_S5_A1, assignment_id: ASSIGN1_ID, student_id: s5Id, lab_id: LAB1_ID, current_step: 1, prelab_completed: true, status: 'on_track', quick_note: null, started_at: hoursAgo(3), completed_at: null },
    { id: RUN_S6_A1, assignment_id: ASSIGN1_ID, student_id: s6Id, lab_id: LAB1_ID, current_step: 2, prelab_completed: true, status: 'waiting_for_check', quick_note: 'Ready for teacher to check my setup before I add water', started_at: hoursAgo(4), completed_at: null },
    // Assignment 2 — Chromatography, Period 1 Biology
    { id: RUN_S3_A2, assignment_id: ASSIGN2_ID, student_id: s3Id, lab_id: LAB2_ID, current_step: 1, prelab_completed: true, status: 'on_track', quick_note: null, started_at: hoursAgo(2), completed_at: null },
    { id: RUN_S5_A2, assignment_id: ASSIGN2_ID, student_id: s5Id, lab_id: LAB2_ID, current_step: 2, prelab_completed: true, status: 'waiting_for_check', quick_note: 'Finished running the strip, ready to mark bands', started_at: hoursAgo(3), completed_at: null },
    // Assignment 3 — pH Lab, Period 5 Chemistry
    { id: RUN_S4_A3, assignment_id: ASSIGN3_ID, student_id: s4Id, lab_id: LAB3_ID, current_step: 3, prelab_completed: true, status: 'on_track', quick_note: null, started_at: hoursAgo(26), completed_at: hoursAgo(25) },
    { id: RUN_S6_A3, assignment_id: ASSIGN3_ID, student_id: s6Id, lab_id: LAB3_ID, current_step: 2, prelab_completed: true, status: 'need_help', quick_note: null, started_at: hoursAgo(4), completed_at: null },
  ]
  await step('All lab runs', async () => {
    const { error } = await supabase.from('student_lab_runs').upsert(runs, { onConflict: 'assignment_id,student_id' })
    if (error) throw error
  })

  // ── Step 9: pre-lab responses ──
  console.log('\nStep 9: Pre-lab responses')
  await step('Density pre-lab responses', async () => {
    const { error } = await supabase.from('pre_lab_responses').upsert([
      // Sam (completed)
      { lab_run_id: RUN_S1_A1, question_id: LAB1_Q1, student_id: s1Id, response_text: 'Density is mass per unit volume: D = m/V. D is density in g/mL, m is mass in grams, and V is volume in milliliters.', is_valid: true },
      { lab_run_id: RUN_S1_A1, question_id: LAB1_Q2, student_id: s1Id, response_text: 'Zeroing or taring sets the scale reading to zero with the empty container on it, so that only the mass of what you add is measured. Without zeroing you would include the container mass in your measurement.', is_valid: true },
      // Jordan (stuck step 2)
      { lab_run_id: RUN_S2_A1, question_id: LAB1_Q1, student_id: s2Id, response_text: 'Density = mass divided by volume. D=m/V, where D is in g/mL, m is grams, V is mL.', is_valid: true },
      { lab_run_id: RUN_S2_A1, question_id: LAB1_Q2, student_id: s2Id, response_text: 'Zeroing means you reset the balance to zero so the container doesn\'t count in the weight.', is_valid: true },
      // Alex (need help step 3)
      { lab_run_id: RUN_S3_A1, question_id: LAB1_Q1, student_id: s3Id, response_text: 'D=m/V. Density is how heavy something is for its size.', is_valid: true },
      { lab_run_id: RUN_S3_A1, question_id: LAB1_Q2, student_id: s3Id, response_text: 'Taring resets the scale to 0 so the container weight isn\'t included in the mass you measure.', is_valid: true },
      // Ethan (on track step 1)
      { lab_run_id: RUN_S5_A1, question_id: LAB1_Q1, student_id: s5Id, response_text: 'Density = mass / volume. D in g/mL, m in grams, V in milliliters.', is_valid: true },
      { lab_run_id: RUN_S5_A1, question_id: LAB1_Q2, student_id: s5Id, response_text: 'Zeroing removes the container\'s weight from the measurement so only the substance inside is measured.', is_valid: true },
      // Sofia (waiting for check step 2)
      { lab_run_id: RUN_S6_A1, question_id: LAB1_Q1, student_id: s6Id, response_text: 'D = m/V where density is in g/mL, mass in g, volume in mL.', is_valid: true },
      { lab_run_id: RUN_S6_A1, question_id: LAB1_Q2, student_id: s6Id, response_text: 'You set the balance to zero with the empty beaker so only the water is measured, not the beaker too.', is_valid: true },
    ], { onConflict: 'lab_run_id,question_id' })
    if (error) throw error
  })

  await step('Chromatography pre-lab responses', async () => {
    const { error } = await supabase.from('pre_lab_responses').upsert([
      { lab_run_id: RUN_S3_A2, question_id: LAB2_Q1, student_id: s3Id, response_text: 'Chromatography separates mixtures by moving them through a stationary phase with a solvent. Different components stick to the paper differently, so they move at different speeds and end up at different positions.', is_valid: true },
      { lab_run_id: RUN_S3_A2, question_id: LAB2_Q2, student_id: s3Id, response_text: 'Rf = distance pigment traveled / distance solvent traveled. An Rf close to 1.0 means the pigment dissolves very well in the solvent and doesn\'t stick to the paper much.', is_valid: true },
      { lab_run_id: RUN_S5_A2, question_id: LAB2_Q1, student_id: s5Id, response_text: 'Chromatography separates mixtures using a solvent moving through paper. Each pigment travels a different distance based on how soluble it is.', is_valid: true },
      { lab_run_id: RUN_S5_A2, question_id: LAB2_Q2, student_id: s5Id, response_text: 'Rf = pigment distance / solvent distance. Close to 1.0 means very soluble in the solvent.', is_valid: true },
    ], { onConflict: 'lab_run_id,question_id' })
    if (error) throw error
  })

  await step('pH pre-lab responses', async () => {
    const { error } = await supabase.from('pre_lab_responses').upsert([
      { lab_run_id: RUN_S4_A3, question_id: LAB3_Q1, student_id: s4Id, response_text: 'pH measures the concentration of hydrogen ions in a solution. The scale runs 0-14: acids are below 7, neutral is 7, and bases are above 7. Strong acids like battery acid are near 0, and strong bases like bleach are near 14.', is_valid: true },
      { lab_run_id: RUN_S4_A3, question_id: LAB3_Q2, student_id: s4Id, response_text: 'An acid-base indicator is a substance that changes color depending on pH. In acidic solution the red cabbage juice would probably stay red or turn pink. In basic solution it might turn blue, green, or yellow.', is_valid: true },
      { lab_run_id: RUN_S6_A3, question_id: LAB3_Q1, student_id: s6Id, response_text: 'pH measures how acidic or basic a solution is, from 0 to 14. Below 7 is acid, 7 is neutral, above 7 is base.', is_valid: true },
      { lab_run_id: RUN_S6_A3, question_id: LAB3_Q2, student_id: s6Id, response_text: 'An indicator changes color based on pH. I think in acid it would be red and in base maybe green?', is_valid: true },
    ], { onConflict: 'lab_run_id,question_id' })
    if (error) throw error
  })

  // ── Step 10: step responses ──
  console.log('\nStep 10: Step responses')
  await step('Sam — Density steps 1–4 (complete)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S1_A1, step_id: LAB1_S1, student_id: s1Id, data_values: { 'Mass of empty beaker': 87.3 }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S1_A1, step_id: LAB1_S2, student_id: s1Id, data_values: { 'Volume of water': 98 }, reflection_text: 'The meniscus curves downward at the edges. I read from the bottom of the curve because that\'s the true water level — reading from the top would give a higher volume than what\'s actually there.', flags: [], completed: true },
      { lab_run_id: RUN_S1_A1, step_id: LAB1_S3, student_id: s1Id, data_values: { 'Mass of beaker + water': 185.1 }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S1_A1, step_id: LAB1_S4, student_id: s1Id, data_values: { 'Calculated density of water': 0.998 }, reflection_text: null, flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Jordan — Density step 1 (stuck at step 2)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S2_A1, step_id: LAB1_S1, student_id: s2Id, data_values: { 'Mass of empty beaker': 91.0 }, reflection_text: null, flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Alex — Density steps 1–2 (need help at step 3)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S3_A1, step_id: LAB1_S1, student_id: s3Id, data_values: { 'Mass of empty beaker': 88.5 }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S3_A1, step_id: LAB1_S2, student_id: s3Id, data_values: { 'Volume of water': 102 }, reflection_text: 'The water surface curves and I read from the bottom of the curve.', flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Ethan — Density step 1 (on track)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S5_A1, step_id: LAB1_S1, student_id: s5Id, data_values: { 'Mass of empty beaker': 93.2 }, reflection_text: null, flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Sofia — Density steps 1–2 (waiting for check)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S6_A1, step_id: LAB1_S1, student_id: s6Id, data_values: { 'Mass of empty beaker': 86.7 }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S6_A1, step_id: LAB1_S2, student_id: s6Id, data_values: { 'Volume of water': 100 }, reflection_text: 'The meniscus bends down and you read from the lowest point.', flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Ethan — Chromatography steps 1–2 (waiting for check)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S5_A2, step_id: LAB2_S1, student_id: s5Id, data_values: { 'Marker color tested': 'Black' }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S5_A2, step_id: LAB2_S2, student_id: s5Id, data_values: { 'Total distance solvent traveled (cm)': 11.5, 'Time elapsed (minutes)': 12 }, reflection_text: 'I could see the dot starting to spread almost immediately. After a few minutes I noticed at least 3 different colors separating — yellow at the top, then blue, then the original black-ish area.', flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Maya — pH steps 1–3 (complete)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S4_A3, step_id: LAB3_S1, student_id: s4Id, data_values: { 'Predicted pH category — Water': 'Neutral', 'Predicted pH category — Vinegar': 'Acid', 'Predicted pH category — Lemon Juice': 'Acid', 'Predicted pH category — Baking Soda': 'Base', 'Predicted pH category — Milk': 'Neutral', 'Predicted pH category — Ammonia': 'Base' }, reflection_text: null, flags: [], completed: true },
      { lab_run_id: RUN_S4_A3, step_id: LAB3_S2, student_id: s4Id, data_values: { 'Color — Water': 'Purple', 'Color — Vinegar': 'Bright pink-red', 'Color — Lemon Juice': 'Hot pink', 'Color — Baking Soda': 'Blue-green', 'Color — Milk': 'Light purple', 'Color — Ammonia': 'Yellow-green' }, reflection_text: 'The vinegar and lemon juice were the most dramatically different — both turned bright pinks/reds. The ammonia turned a completely different yellow-green color which I didn\'t expect.', flags: [], completed: true },
      { lab_run_id: RUN_S4_A3, step_id: LAB3_S3, student_id: s4Id, data_values: { 'Classification — Water': 'Neutral', 'Classification — Vinegar': 'Acid', 'Classification — Lemon Juice': 'Acid', 'Classification — Baking Soda': 'Base', 'Classification — Milk': 'Slightly acidic', 'Classification — Ammonia': 'Base', 'Rank (1=most acidic → 6=most basic)': 'Lemon Juice, Vinegar, Milk, Water, Baking Soda, Ammonia' }, reflection_text: 'I was surprised that milk was slightly acidic — I thought it would be neutral. All my other predictions were correct!', flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  await step('Sofia — pH step 1 (need help at step 2)', async () => {
    const { error } = await supabase.from('step_responses').upsert([
      { lab_run_id: RUN_S6_A3, step_id: LAB3_S1, student_id: s6Id, data_values: { 'Predicted pH category — Water': 'Neutral', 'Predicted pH category — Vinegar': 'Acid', 'Predicted pH category — Lemon Juice': 'Acid', 'Predicted pH category — Baking Soda': 'Base', 'Predicted pH category — Milk': 'Neutral', 'Predicted pH category — Ammonia': 'Neutral' }, reflection_text: null, flags: [], completed: true },
    ], { onConflict: 'lab_run_id,step_id' })
    if (error) throw error
  })

  // ── Step 11: help requests ──
  console.log('\nStep 11: Help requests')
  const now = new Date().toISOString()
  await step('Jordan — escalated help (stuck on balance)', async () => {
    const { error } = await supabase.from('help_requests').upsert([{
      lab_run_id: RUN_S2_A1, student_id: s2Id, step_id: LAB1_S2,
      escalated_to_teacher: true, resolved: false,
      conversation: [
        { role: 'user', content: 'My balance keeps moving back and forth and I can\'t get it to stay still. The reading keeps changing between 90.8 and 91.2 grams. What am I doing wrong?', ts: hoursAgo(5.5) },
        { role: 'assistant', content: 'That\'s a great observation! Before we troubleshoot, let me ask you — where is the balance placed right now? Is it on a completely flat surface, and are there any vibrations nearby (like from air conditioning or other students moving around)?', ts: hoursAgo(5.4) },
        { role: 'user', content: 'It\'s on my desk and yeah other people are walking around a lot. But even when I wait it keeps changing.', ts: hoursAgo(5.3) },
        { role: 'assistant', content: 'Good thinking on waiting for others to settle! Here\'s a hint: look very carefully at the balance itself — are all three of the sliders (riders) sitting perfectly in their notches, or could any of them be resting between two notches? Also, is the balance needle centered in the window, or does it swing back and forth?', ts: hoursAgo(5.2) },
        { role: 'user', content: 'I think the small rider might be between notches. Let me fix that... okay I moved it to 0.0 but the needle is still swinging a bit.', ts: hoursAgo(5.1) },
        { role: 'assistant', content: 'You\'re on the right track! A needle that swings evenly around the center line is actually balanced — you don\'t need it completely still, just swinging the same amount on both sides. Try reading your mass when the needle appears to be centered at the midpoint of its swing. Does that give you a more stable reading?', ts: hoursAgo(5.0) },
        { role: 'user', content: 'It\'s still jumping around too much. I need help from the teacher.', ts: hoursAgo(4.9) },
      ]
    }], { onConflict: undefined })
    if (error) throw error
  })

  await step('Alex — AI help in progress (step 3 confusion)', async () => {
    const { error } = await supabase.from('help_requests').upsert([{
      lab_run_id: RUN_S3_A1, student_id: s3Id, step_id: LAB1_S3,
      escalated_to_teacher: false, resolved: false,
      conversation: [
        { role: 'user', content: 'The instructions say "do NOT re-zero for this step" but I already re-zeroed the balance by accident before I put the beaker back on. What do I do?', ts: hoursAgo(4.8) },
        { role: 'assistant', content: 'That\'s a common thing to happen! Before we decide what to do, let me ask: when you re-zeroed with the beaker on the scale, what did you set it to zero? And do you still have your Step 1 mass recorded — the mass of the empty beaker?', ts: hoursAgo(4.7) },
        { role: 'user', content: 'Yes I have the empty beaker mass from step 1, it was 88.5 g. When I re-zeroed I had the empty beaker on the scale.', ts: hoursAgo(4.6) },
        { role: 'assistant', content: 'Great — you have the information you need! Think about this: if you re-zeroed WITH the empty beaker on the scale, and then placed the beaker WITH water and got a new reading, what exactly is that new reading measuring? What does it include and what does it not include?', ts: hoursAgo(4.5) },
        { role: 'user', content: 'Oh... it would just be the mass of the water, not including the beaker? Since I zeroed out the beaker?', ts: hoursAgo(4.4) },
      ]
    }], { onConflict: undefined })
    if (error) throw error
  })

  await step('Sofia — pH step 2 help (indicator color confusion)', async () => {
    const { error } = await supabase.from('help_requests').upsert([{
      lab_run_id: RUN_S6_A3, student_id: s6Id, step_id: LAB3_S2,
      escalated_to_teacher: false, resolved: false,
      conversation: [
        { role: 'user', content: 'My water sample turned green after adding the indicator but the baking soda also turned green. How can I tell them apart if they\'re the same color?', ts: hoursAgo(3.5) },
        { role: 'assistant', content: 'Interesting observation! Let me ask you to look more carefully — are the two greens exactly the same shade? Sometimes colors that look similar at first glance are actually slightly different (e.g., blue-green vs. yellow-green). Can you describe each color as precisely as possible?', ts: hoursAgo(3.4) },
        { role: 'user', content: 'The water looks more purple-ish green and the baking soda looks more yellow-green or teal?', ts: hoursAgo(3.3) },
        { role: 'assistant', content: 'You\'ve spotted it! Those are actually quite different positions on the pH scale. Purple-ish suggests a color close to neutral, while teal or yellow-green suggests more basic. Looking at the pH-color reference chart provided, where would you place each of those colors on the scale?', ts: hoursAgo(3.2) },
      ]
    }], { onConflict: undefined })
    if (error) throw error
  })

  console.log('\n✅ Demo data seed complete!\n')
  console.log('Summary:')
  console.log('  Classes:   3 (Period 1 Bio, Period 3 Earth Sci, Period 5 Chem)')
  console.log('  Students:  6 (Sam, Jordan, Alex, Maya, Ethan, Sofia)')
  console.log('  Labs:      4 (Density ✓, Chromatography ✓, pH ✓, Photosynthesis [draft])')
  console.log('  Runs:      10 across 3 assignments (various stages)')
  console.log('  Help:      3 active conversations (1 escalated)\n')
  console.log('Extra demo accounts:')
  console.log('  student3@westlake.demo / LabFlow2025!  (Alex Chen)')
  console.log('  student4@westlake.demo / LabFlow2025!  (Maya Rodriguez)')
  console.log('  student5@westlake.demo / LabFlow2025!  (Ethan Park)')
  console.log('  student6@westlake.demo / LabFlow2025!  (Sofia Williams)\n')
}

main().catch(err => {
  console.error('\n❌ Demo seed failed:', err.message)
  process.exit(1)
})
