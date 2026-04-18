#!/usr/bin/env node
/**
 * LabFlow — Complete seed script
 * Run once after `supabase db push` to populate all demo data.
 *
 * Usage (from project root):
 *   node supabase/seed-all.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const env = {}
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) env[key.trim()] = rest.join('=').trim()
  })
} catch {
  console.error('Could not read .env.local — make sure it exists at project root')
  process.exit(1)
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Fixed UUIDs ──────────────────────────────────────────────
const ORG_ID        = 'aaaaaaaa-0000-0000-0000-000000000001'
const CLASS_ID      = 'bbbbbbbb-0001-0000-0000-000000000001'
const LAB_ID        = 'cccccccc-0001-0000-0000-000000000001'
const Q1_ID         = 'dddddddd-0001-0000-0000-000000000001'
const Q2_ID         = 'dddddddd-0002-0000-0000-000000000001'
const STEP1_ID      = 'eeeeeeee-0001-0000-0000-000000000001'
const STEP2_ID      = 'eeeeeeee-0002-0000-0000-000000000001'
const STEP3_ID      = 'eeeeeeee-0003-0000-0000-000000000001'
const STEP4_ID      = 'eeeeeeee-0004-0000-0000-000000000001'
const ASSIGNMENT_ID = 'ffffffff-0001-0000-0000-000000000001'

async function step(label, fn) {
  process.stdout.write(`  ${label}... `)
  try {
    const result = await fn()
    console.log('✓')
    return result
  } catch (err) {
    console.log('✗')
    console.error(`    Error: ${err.message}`)
    throw err
  }
}

// ─── 1. Organization ──────────────────────────────────────────
async function seedOrg() {
  const { error } = await supabase.from('organizations').upsert({
    id: ORG_ID,
    name: 'Westlake Science Academy',
    slug: 'westlake',
    primary_color: '#2563EB',
    secondary_color: '#7C3AED',
    footer_text: 'Science Lab Platform powered by LabFlow'
  }, { onConflict: 'id' })
  if (error) throw error
}

// ─── 2. Feature flags ─────────────────────────────────────────
async function seedFlags() {
  const { error } = await supabase.from('feature_flags').upsert([
    { organization_id: ORG_ID, flag_key: 'ai_lab_generation', enabled: true },
    { organization_id: ORG_ID, flag_key: 'help_chat',         enabled: true },
    { organization_id: ORG_ID, flag_key: 'analytics',         enabled: true },
  ], { onConflict: 'organization_id,flag_key' })
  if (error) throw error
}

// ─── 3. Create or fetch a user ────────────────────────────────
async function upsertUser({ email, password, role, first_name, last_name }) {
  // Check if user already exists
  const { data: listData } = await supabase.auth.admin.listUsers()
  const existing = listData?.users?.find(u => u.email === email)
  let userId

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: { role }
    })
    userId = existing.id
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { organization_id: ORG_ID, role, first_name, last_name },
      app_metadata: { role }
    })
    if (error) throw error
    userId = data.user.id
  }

  // Ensure profile exists (trigger may not have fired for pre-existing users)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    organization_id: ORG_ID,
    role,
    first_name,
    last_name,
    avatar_url: null
  }, { onConflict: 'id' })
  if (profileError) throw profileError

  return userId
}

// ─── 4. Class ─────────────────────────────────────────────────
async function seedClass(teacherId) {
  const { error } = await supabase.from('classes').upsert({
    id: CLASS_ID,
    organization_id: ORG_ID,
    teacher_id: teacherId,
    name: 'Period 3 — Earth Science',
    description: 'Introductory Earth Science for 8th graders.',
    period: '3',
    school_year: '2025-2026',
    archived: false
  }, { onConflict: 'id' })
  if (error) throw error
}

// ─── 5. Lab ───────────────────────────────────────────────────
async function seedLab(teacherId) {
  const { error } = await supabase.from('labs').upsert({
    id: LAB_ID,
    organization_id: ORG_ID,
    teacher_id: teacherId,
    title: 'Measuring the Density of Water',
    overview: 'In this lab, students will use a triple-beam balance and a graduated cylinder to measure the mass and volume of water samples, then calculate density.',
    objectives: [
      'Measure mass using a triple-beam balance with an accuracy of ±0.1 g',
      'Measure liquid volume using a graduated cylinder with an accuracy of ±1 mL',
      'Calculate density using the formula D = m/V',
      'Compare experimental results to accepted values and calculate percent error',
      'Identify and explain potential sources of experimental error'
    ],
    standards: ['NGSS MS-PS1-2', 'NGSS MS-ETS1-4'],
    materials_list: [
      'Triple-beam balance or digital scale (±0.1 g)',
      '100 mL graduated cylinder',
      '250 mL beaker',
      'Distilled water (approximately 150 mL)',
      'Wash bottle',
      'Lab notebook or data sheet',
      'Calculator'
    ],
    safety_notes: 'Water spills can make the floor slippery — wipe up immediately. Do not use glassware that is chipped or cracked. Report any broken glass to the teacher immediately.',
    background: 'Density is defined as mass per unit volume (D = m/V). Pure water at 4°C has a density of exactly 1.000 g/mL. At room temperature (~25°C), the accepted density of water is 0.997 g/mL.',
    teacher_notes: 'Remind students to zero the balance before each measurement. Common errors: reading the meniscus from the top, not re-zeroing, calculating mass of water incorrectly.',
    status: 'published',
    ai_generated: false,
    estimated_minutes: 45
  }, { onConflict: 'id' })
  if (error) throw error
}

// ─── 6. Pre-lab questions ─────────────────────────────────────
async function seedPreLabQuestions() {
  const { error } = await supabase.from('pre_lab_questions').upsert([
    {
      id: Q1_ID,
      lab_id: LAB_ID,
      position: 1,
      question_text: 'What is the formula for density? Define each variable and give its SI unit.',
      question_type: 'short_answer',
      required: true
    },
    {
      id: Q2_ID,
      lab_id: LAB_ID,
      position: 2,
      question_text: 'Explain what it means to "zero" or "tare" a balance before taking a measurement. Why is this step important?',
      question_type: 'short_answer',
      required: true
    }
  ], { onConflict: 'id' })
  if (error) throw error
}

// ─── 7. Lab steps ─────────────────────────────────────────────
async function seedSteps() {
  const { error } = await supabase.from('lab_steps').upsert([
    {
      id: STEP1_ID,
      lab_id: LAB_ID,
      step_number: 1,
      title: 'Mass of Empty Beaker',
      instructions: 'Place the clean, dry 250 mL beaker on the triple-beam balance. Zero/tare the balance with the beaker in place, or record the mass of the empty beaker before adding water. Adjust the riders until the balance beam is level, then record the mass.',
      checkpoint: 'Check: Is your beaker completely dry? Even a few drops of water will change your mass reading.',
      data_entry_fields: [{ label: 'Mass of empty beaker', type: 'number', unit: 'g', min: 0, max: 500, required: true }],
      reflection_prompt: null,
      troubleshooting: 'If the balance will not balance, the beaker may be too heavy for the scale range — ask your teacher for a different beaker.'
    },
    {
      id: STEP2_ID,
      lab_id: LAB_ID,
      step_number: 2,
      title: 'Add Water and Record Volume',
      instructions: 'Use the wash bottle to carefully add approximately 100 mL of distilled water to the graduated cylinder. Hold the graduated cylinder at eye level and read the volume at the BOTTOM of the meniscus. Record the exact volume to the nearest 1 mL.',
      checkpoint: null,
      data_entry_fields: [{ label: 'Volume of water', type: 'number', unit: 'mL', min: 0, max: 250, required: true }],
      reflection_prompt: 'Describe what happens to the water surface (the meniscus) and explain why you read from the bottom of the curve.',
      troubleshooting: 'If you added too much water and went over 100 mL, that is okay — record whatever volume you actually have.'
    },
    {
      id: STEP3_ID,
      lab_id: LAB_ID,
      step_number: 3,
      title: 'Mass of Beaker + Water',
      instructions: 'Place the beaker containing your water sample on the triple-beam balance. Move the riders to find the total mass of the beaker plus water. Make sure the balance beam is level before recording.',
      checkpoint: 'IMPORTANT: Do NOT re-zero/tare the balance for this step. You need the actual combined mass of beaker + water.',
      data_entry_fields: [{ label: 'Mass of beaker + water', type: 'number', unit: 'g', min: 0, max: 500, required: true }],
      reflection_prompt: null,
      troubleshooting: 'If your beaker + water mass is LESS than your empty beaker mass from Step 1, something went wrong — either you re-zeroed the balance or recorded the wrong value.'
    },
    {
      id: STEP4_ID,
      lab_id: LAB_ID,
      step_number: 4,
      title: 'Calculate and Record Density',
      instructions: 'Calculate the mass of water alone: Mass of water = (Mass of beaker + water) − (Mass of empty beaker). Then calculate density: Density = Mass of water ÷ Volume of water. Express your answer in g/mL rounded to two decimal places.',
      checkpoint: null,
      data_entry_fields: [{ label: 'Calculated density of water', type: 'number', unit: 'g/mL', min: 0, max: 2, required: true }],
      reflection_prompt: null,
      troubleshooting: 'Expected result: your density should be between 0.90 and 1.10 g/mL. The accepted value for water at room temperature is approximately 0.997 g/mL. If outside this range, check your subtraction and make sure mass is in grams and volume in mL.'
    }
  ], { onConflict: 'id' })
  if (error) throw error
}

// ─── 8. Lab assignment ────────────────────────────────────────
async function seedAssignment(teacherId) {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  const { error } = await supabase.from('lab_assignments').upsert({
    id: ASSIGNMENT_ID,
    lab_id: LAB_ID,
    class_id: CLASS_ID,
    assigned_by: teacherId,
    due_date: dueDate.toISOString().split('T')[0],
    instructions_override: null
  }, { onConflict: 'id' })
  if (error) throw error
}

// ─── 9. Enrollments ───────────────────────────────────────────
async function seedEnrollments(studentIds) {
  const rows = studentIds.map((studentId) => ({ class_id: CLASS_ID, student_id: studentId }))
  const { error } = await supabase.from('class_enrollments').upsert(rows, { onConflict: 'class_id,student_id' })
  if (error) throw error
}

// ─── 10. Student run states ──────────────────────────────────
async function seedStudentRunStates(studentIds) {
  const now = Date.now()
  const iso = (msAgo) => new Date(now - msAgo).toISOString()

  const [s1Id, s2Id, s3Id, s4Id, s5Id, s6Id] = studentIds

  const { error } = await supabase.from('student_lab_runs').upsert([
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s1Id,
      lab_id: LAB_ID,
      current_step: 2,
      prelab_completed: true,
      status: 'on_track',
      quick_note: 'Proceeding at expected pace.',
      started_at: iso(1000 * 60 * 60 * 26),
      completed_at: null,
    },
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s2Id,
      lab_id: LAB_ID,
      current_step: 2,
      prelab_completed: true,
      status: 'stuck',
      quick_note: 'Needs support with mass/volume setup.',
      started_at: iso(1000 * 60 * 60 * 21),
      completed_at: null,
    },
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s3Id,
      lab_id: LAB_ID,
      current_step: 3,
      prelab_completed: true,
      status: 'need_help',
      quick_note: 'Requested teacher check-in.',
      started_at: iso(1000 * 60 * 60 * 18),
      completed_at: null,
    },
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s4Id,
      lab_id: LAB_ID,
      current_step: 3,
      prelab_completed: true,
      status: 'waiting_for_check',
      quick_note: 'Waiting for teacher verification.',
      started_at: iso(1000 * 60 * 60 * 15),
      completed_at: null,
    },
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s5Id,
      lab_id: LAB_ID,
      current_step: 4,
      prelab_completed: true,
      status: 'finished_step',
      quick_note: 'Ready for final review.',
      started_at: iso(1000 * 60 * 60 * 10),
      completed_at: null,
    },
    {
      assignment_id: ASSIGNMENT_ID,
      student_id: s6Id,
      lab_id: LAB_ID,
      current_step: 4,
      prelab_completed: true,
      status: 'finished_step',
      quick_note: 'Completed lab and awaiting grade.',
      started_at: iso(1000 * 60 * 60 * 30),
      completed_at: iso(1000 * 60 * 60 * 2),
    },
  ], { onConflict: 'assignment_id,student_id' })
  if (error) throw error
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 LabFlow Seed Script\n')

  console.log('Step 1: Organization & feature flags')
  await step('Create organization', seedOrg)
  await step('Create feature flags', seedFlags)

  console.log('\nStep 2: Demo users')
  await step('demo@westlake.demo (demo gateway)',  () => upsertUser({ email: 'demo@westlake.demo',   password: 'LabFlow2025!', role: 'school_admin', first_name: 'Demo',   last_name: 'Gateway' }))
  const adminId   = await step('admin@westlake.demo (school_admin)',   () => upsertUser({ email: 'admin@westlake.demo',    password: 'LabFlow2025!', role: 'school_admin', first_name: 'Alice',  last_name: 'Admin'   }))
  const teacherId = await step('teacher@westlake.demo (teacher)',       () => upsertUser({ email: 'teacher@westlake.demo',  password: 'LabFlow2025!', role: 'teacher',      first_name: 'Taylor', last_name: 'Teacher' }))
  const s1Id      = await step('student1@westlake.demo (student)',      () => upsertUser({ email: 'student1@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Sam',    last_name: 'Student' }))
  const s2Id      = await step('student2@westlake.demo (student)',      () => upsertUser({ email: 'student2@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Jordan', last_name: 'Learner' }))
  const s3Id      = await step('student3@westlake.demo (student)',      () => upsertUser({ email: 'student3@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Alex',   last_name: 'Chen' }))
  const s4Id      = await step('student4@westlake.demo (student)',      () => upsertUser({ email: 'student4@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Maya',   last_name: 'Rodriguez' }))
  const s5Id      = await step('student5@westlake.demo (student)',      () => upsertUser({ email: 'student5@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Ethan',  last_name: 'Park' }))
  const s6Id      = await step('student6@westlake.demo (student)',      () => upsertUser({ email: 'student6@westlake.demo', password: 'LabFlow2025!', role: 'student',      first_name: 'Sofia',  last_name: 'Williams' }))

  console.log('\nStep 3: Demo lab content')
  await step('Create demo class',          () => seedClass(teacherId))
  await step('Create demo lab',            () => seedLab(teacherId))
  await step('Create pre-lab questions',   seedPreLabQuestions)
  await step('Create lab steps (1–4)',     seedSteps)
  await step('Assign lab to class',        () => seedAssignment(teacherId))
  await step('Enroll students in class',   () => seedEnrollments([s1Id, s2Id, s3Id, s4Id, s5Id, s6Id]))
  await step('Seed student run states',    () => seedStudentRunStates([s1Id, s2Id, s3Id, s4Id, s5Id, s6Id]))

  console.log('\n✅ Seed complete!\n')
  console.log('Demo accounts:')
  console.log('  demo@westlake.demo     / LabFlow2025!  (Demo Gateway)')
  console.log('  admin@westlake.demo    / LabFlow2025!  (School Admin)')
  console.log('  teacher@westlake.demo  / LabFlow2025!  (Teacher)')
  console.log('  student1@westlake.demo / LabFlow2025!  (Student)')
  console.log('  student2@westlake.demo / LabFlow2025!  (Student)')
  console.log('  student3@westlake.demo / LabFlow2025!  (Student)')
  console.log('  student4@westlake.demo / LabFlow2025!  (Student)')
  console.log('  student5@westlake.demo / LabFlow2025!  (Student)')
  console.log('  student6@westlake.demo / LabFlow2025!  (Student)\n')
  console.log('Org sign-up code: westlake\n')
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
