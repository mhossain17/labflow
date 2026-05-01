#!/usr/bin/env node
/**
 * LabFlow — Expanded demo seed
 * Run AFTER seed-all.mjs + seed-demo.mjs.
 *
 *   node supabase/seed-expanded.mjs
 *
 * Adds:
 *  - 3 new teachers (teacher2-4)
 *  - 24 new students (student7-30)
 *  - 6 new subject classes
 *  - 6 new full labs (10-15 steps each, varied field types)
 *  - Expanded steps for density lab (4→12)
 *  - 30 student lab runs in varied states
 *  - Historical completed+graded runs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = [resolve(__dirname, '../.env.local'), resolve(__dirname, '../.env')]
  .find((p) => { try { readFileSync(p); return true } catch { return false } })
if (!envPath) { console.error('No .env.local or .env found'); process.exit(1) }

const env = {}
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const idx = trimmed.indexOf('=')
  if (idx < 0) return
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
})

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false },
})

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

// ─── Fixed UUIDs ───────────────────────────────────────────────────────────────
const ORG_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

// Existing classes / labs
const CLASS1_ID   = 'bbbbbbbb-0001-0000-0000-000000000001' // Period 3 Earth Science
const LAB1_ID     = 'cccccccc-0001-0000-0000-000000000001' // Density (exists, expand steps)
const ASSIGN1_ID  = 'ffffffff-0001-0000-0000-000000000001' // Density → Earth Science

// New classes
const CLASS4_ID   = 'bbbbbbbb-0004-0000-0000-000000000001' // Period 2 Chemistry
const CLASS5_ID   = 'bbbbbbbb-0005-0000-0000-000000000001' // Period 4 Biology
const CLASS6_ID   = 'bbbbbbbb-0006-0000-0000-000000000001' // Period 1 Digital Electronics
const CLASS7_ID   = 'bbbbbbbb-0007-0000-0000-000000000001' // Period 6 Computer Science
const CLASS8_ID   = 'bbbbbbbb-0008-0000-0000-000000000001' // Period 7 Architecture
const CLASS9_ID   = 'bbbbbbbb-0009-0000-0000-000000000001' // Period 8 Carpentry

// New labs
const LAB_CHEM_ID = 'cccccccc-0010-0000-0000-000000000001' // Acid-Base Titration
const LAB_BIO_ID  = 'cccccccc-0011-0000-0000-000000000001' // Osmosis
const LAB_EE_ID   = 'cccccccc-0012-0000-0000-000000000001' // Logic Gates
const LAB_CS_ID   = 'cccccccc-0013-0000-0000-000000000001' // Sorting Algorithms
const LAB_ARC_ID  = 'cccccccc-0014-0000-0000-000000000001' // Load-Bearing Structures
const LAB_CARP_ID = 'cccccccc-0015-0000-0000-000000000001' // Dovetail Joint

// Assignments
const ASSIGN_CHEM_ID = 'ffffffff-0004-0000-0000-000000000001'
const ASSIGN_BIO_ID  = 'ffffffff-0005-0000-0000-000000000001'
const ASSIGN_EE_ID   = 'ffffffff-0006-0000-0000-000000000001'
const ASSIGN_CS_ID   = 'ffffffff-0007-0000-0000-000000000001'
const ASSIGN_ARC_ID  = 'ffffffff-0008-0000-0000-000000000001'
const ASSIGN_CARP_ID = 'ffffffff-0009-0000-0000-000000000001'

// Historical assignment IDs (completed last semester)
const HIST_CHEM_ID = 'ffffffff-0010-0000-0000-000000000001'
const HIST_BIO_ID  = 'ffffffff-0011-0000-0000-000000000001'
const HIST_EE_ID   = 'ffffffff-0012-0000-0000-000000000001'

// ─── New teacher accounts ───────────────────────────────────────────────────
const NEW_TEACHERS = [
  { email: 'teacher2@westlake.demo', password: 'LabFlow2025!', first_name: 'Morgan', last_name: 'Chen',   role: 'teacher' },
  { email: 'teacher3@westlake.demo', password: 'LabFlow2025!', first_name: 'Jamie',  last_name: 'Rivera', role: 'teacher' },
  { email: 'teacher4@westlake.demo', password: 'LabFlow2025!', first_name: 'Alex',   last_name: 'Kim',    role: 'teacher' },
]

// ─── New student accounts ───────────────────────────────────────────────────
const NEW_STUDENTS = [
  { email: 'student7@westlake.demo',  first_name: 'Priya',    last_name: 'Patel' },
  { email: 'student8@westlake.demo',  first_name: 'Marcus',   last_name: 'Johnson' },
  { email: 'student9@westlake.demo',  first_name: 'Aisha',    last_name: 'Abdullah' },
  { email: 'student10@westlake.demo', first_name: 'Tyler',    last_name: 'Brown' },
  { email: 'student11@westlake.demo', first_name: 'Zoe',      last_name: 'Garcia' },
  { email: 'student12@westlake.demo', first_name: 'Kai',      last_name: 'Nguyen' },
  { email: 'student13@westlake.demo', first_name: 'Isabella', last_name: 'Martinez' },
  { email: 'student14@westlake.demo', first_name: 'Liam',     last_name: "O'Brien" },
  { email: 'student15@westlake.demo', first_name: 'Fatima',   last_name: 'Hassan' },
  { email: 'student16@westlake.demo', first_name: 'Noah',     last_name: 'Taylor' },
  { email: 'student17@westlake.demo', first_name: 'Chloe',    last_name: 'Anderson' },
  { email: 'student18@westlake.demo', first_name: 'James',    last_name: 'Wilson' },
  { email: 'student19@westlake.demo', first_name: 'Mia',      last_name: 'Thompson' },
  { email: 'student20@westlake.demo', first_name: 'Lucas',    last_name: 'Harris' },
  { email: 'student21@westlake.demo', first_name: 'Ava',      last_name: 'Davis' },
  { email: 'student22@westlake.demo', first_name: 'Owen',     last_name: 'Martinez' },
  { email: 'student23@westlake.demo', first_name: 'Lily',     last_name: 'Jackson' },
  { email: 'student24@westlake.demo', first_name: 'Daniel',   last_name: 'White' },
  { email: 'student25@westlake.demo', first_name: 'Grace',    last_name: 'Lee' },
  { email: 'student26@westlake.demo', first_name: 'Benjamin', last_name: 'Clark' },
  { email: 'student27@westlake.demo', first_name: 'Nadia',    last_name: 'Ahmed' },
  { email: 'student28@westlake.demo', first_name: 'Ryan',     last_name: 'Nelson' },
  { email: 'student29@westlake.demo', first_name: 'Emma',     last_name: 'Robinson' },
  { email: 'student30@westlake.demo', first_name: 'Carlos',   last_name: 'Rivera' },
]

async function createUser(u, role = 'student') {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password ?? 'LabFlow2025!',
    email_confirm: true,
    user_metadata: {
      organization_id: ORG_ID,
      role,
      first_name: u.first_name,
      last_name: u.last_name,
    },
    app_metadata: { role },
  })
  if (error && !error.message.includes('already been registered')) throw error
  return data?.user?.id ?? null
}

// Look up profile ID by email (handles already-existing users)
async function profileIdByEmail(email) {
  const { data } = await supabase.from('profiles').select('id').eq('email', email).single()
  return data?.id ?? null
}

// ─── Density lab: add 8 more steps (5-12) ──────────────────────────────────
const DENSITY_EXTRA_STEPS = [
  {
    id: 'eeeeeeee-0005-0000-0000-000000000001',
    step_number: 5,
    title: 'Repeat with a Different Volume',
    instructions: 'Repeat steps 1–4 using approximately 50 mL of distilled water instead of 100 mL. Record all three measurements in your lab notebook and calculate the density again.',
    checkpoint: 'You should have two separate density calculations now — one for ~100 mL and one for ~50 mL. They should be very close to each other.',
    data_entry_fields: [
      { label: 'Mass of empty beaker (trial 2)', type: 'number', unit: 'g', min: 0, max: 500, required: true, placeholder: 'e.g. 82.4' },
      { label: 'Volume of water (trial 2)', type: 'number', unit: 'mL', min: 0, max: 250, required: true, placeholder: 'e.g. 52' },
      { label: 'Mass of beaker + water (trial 2)', type: 'number', unit: 'g', min: 0, max: 500, required: true, placeholder: 'e.g. 134.2' },
      { label: 'Calculated density (trial 2)', type: 'number', unit: 'g/mL', min: 0, max: 2, required: true, placeholder: 'e.g. 1.00' },
    ],
    reflection_prompt: 'Compare your two density values. Are they the same? What does this tell you about density as a physical property?',
    troubleshooting: 'If the two density values differ by more than 0.05 g/mL, re-check your volume and mass readings for transcription errors.',
  },
  {
    id: 'eeeeeeee-0006-0000-0000-000000000001',
    step_number: 6,
    title: 'Calculate Average Density',
    instructions: 'Find the average of your two experimental density values. Then calculate percent error using the formula: |experimental − accepted| ÷ accepted × 100%. The accepted value for water at room temperature is 0.997 g/mL.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Average density', type: 'number', unit: 'g/mL', min: 0, max: 2, required: true, placeholder: 'e.g. 0.998' },
      { label: 'Percent error', type: 'number', unit: '%', min: 0, max: 100, required: true, placeholder: 'e.g. 0.3' },
    ],
    reflection_prompt: null,
    troubleshooting: 'Percent error greater than 5% suggests a systematic error. Check whether the balance was zeroed correctly and that no water spilled between measurements.',
  },
  {
    id: 'eeeeeeee-0007-0000-0000-000000000001',
    step_number: 7,
    title: 'Room Temperature Measurement',
    instructions: 'Use the thermometer to measure the room temperature and record it. Water density changes slightly with temperature. Look up or use the table provided to find the accepted density of water at your measured temperature.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Room temperature', type: 'number', unit: '°C', min: 15, max: 35, required: true, placeholder: 'e.g. 22' },
      { label: 'Accepted density at this temperature', type: 'number', unit: 'g/mL', min: 0.99, max: 1.0, required: true, placeholder: 'e.g. 0.9977' },
    ],
    reflection_prompt: 'How does the accepted density at your temperature compare to the 0.997 g/mL value often given in textbooks? Is the difference significant?',
    troubleshooting: 'If the thermometer reads below 15°C or above 35°C, check whether it has been left near a heat source or window.',
  },
  {
    id: 'eeeeeeee-0008-0000-0000-000000000001',
    step_number: 8,
    title: 'Recalculate Percent Error with Temperature-Corrected Value',
    instructions: 'Recalculate percent error using the temperature-corrected accepted density from Step 7 instead of 0.997 g/mL.',
    checkpoint: 'After this step, call your teacher over to check your calculations before proceeding.',
    data_entry_fields: [
      { label: 'Revised percent error', type: 'number', unit: '%', min: 0, max: 100, required: true, placeholder: 'e.g. 0.1' },
    ],
    reflection_prompt: null,
    troubleshooting: null,
  },
  {
    id: 'eeeeeeee-0009-0000-0000-000000000001',
    step_number: 9,
    title: 'Sources of Error Analysis',
    instructions: 'List at least three specific sources of experimental error that could have affected your measurements. For each source, indicate whether it would cause the measured density to be higher or lower than the true value.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Source of error 1', type: 'text', required: true, placeholder: 'e.g. Parallax error when reading meniscus' },
      { label: 'Effect (higher/lower)', type: 'text', required: true, placeholder: 'higher or lower' },
      { label: 'Source of error 2', type: 'text', required: true, placeholder: 'e.g. Residual water in beaker from previous use' },
      { label: 'Effect (higher/lower)', type: 'text', required: false, placeholder: 'higher or lower' },
    ],
    reflection_prompt: 'Which source of error do you think had the largest effect on your results? Why?',
    troubleshooting: null,
  },
  {
    id: 'eeeeeeee-0010-0000-0000-000000000001',
    step_number: 10,
    title: 'Predict Density of Other Liquids',
    instructions: 'Based on what you know about density, predict whether each of the following liquids would sink or float on water: vegetable oil, rubbing alcohol (isopropanol), corn syrup, and dish soap. Explain your reasoning for each.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Vegetable oil: sink or float?', type: 'text', required: true, placeholder: 'float or sink' },
      { label: 'Rubbing alcohol: sink or float?', type: 'text', required: true, placeholder: 'float or sink' },
      { label: 'Corn syrup: sink or float?', type: 'text', required: true, placeholder: 'float or sink' },
      { label: 'Dish soap: sink or float?', type: 'text', required: true, placeholder: 'float or sink' },
    ],
    reflection_prompt: null,
    troubleshooting: null,
  },
  {
    id: 'eeeeeeee-0011-0000-0000-000000000001',
    step_number: 11,
    title: 'Real-World Applications',
    instructions: 'Answer the following questions about real-world density applications.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Why does ice float on liquid water?', type: 'text', required: true, placeholder: 'Explain in terms of density...' },
      { label: 'How do submarines control depth?', type: 'text', required: true, placeholder: 'Explain in terms of buoyancy and density...' },
      { label: 'Give one industrial application of density measurement', type: 'text', required: true, placeholder: 'e.g. Quality control in food manufacturing...' },
    ],
    reflection_prompt: 'How has this lab changed or deepened your understanding of density as a concept?',
    troubleshooting: null,
  },
  {
    id: 'eeeeeeee-0012-0000-0000-000000000001',
    step_number: 12,
    title: 'Lab Conclusion',
    instructions: 'Write a formal conclusion paragraph (4–6 sentences) summarizing: (1) your experimental results, (2) how they compare to the accepted value, (3) your main sources of error, and (4) what you would do differently if you repeated the experiment.',
    checkpoint: null,
    data_entry_fields: [
      { label: 'Conclusion paragraph', type: 'text', required: true, placeholder: 'Write your 4-6 sentence conclusion here...' },
    ],
    reflection_prompt: null,
    troubleshooting: null,
  },
]

// ─── Chemistry lab: Acid-Base Titration (15 steps) ─────────────────────────
function chemSteps(labId) {
  return [
    { step_number: 1, title: 'Safety Review', instructions: 'Read all safety protocols for working with acids and bases. Put on your safety goggles, gloves, and lab coat before handling any chemicals.', checkpoint: 'Confirm with your teacher that you have all PPE in place before proceeding.', data_entry_fields: [{ label: 'Safety equipment confirmed (yes/no)', type: 'text', required: true, placeholder: 'yes' }], reflection_prompt: null, troubleshooting: 'Never handle NaOH or HCl without gloves — they cause chemical burns.' },
    { step_number: 2, title: 'Prepare the Burette', instructions: 'Rinse the burette with a small volume of the NaOH solution, then fill it to above the 0.00 mL mark. Open the stopcock briefly to remove bubbles and bring the meniscus exactly to 0.00 mL.', checkpoint: null, data_entry_fields: [{ label: 'Initial burette reading', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 0.00' }], reflection_prompt: null, troubleshooting: 'Air bubbles in the burette tip cause inaccurate readings — always remove them before starting.' },
    { step_number: 3, title: 'Prepare the Analyte', instructions: 'Pipette exactly 25.00 mL of HCl solution into a clean Erlenmeyer flask. Add 3 drops of phenolphthalein indicator.', checkpoint: null, data_entry_fields: [{ label: 'Volume of HCl used', type: 'number', unit: 'mL', min: 24, max: 26, required: true, placeholder: '25.00' }, { label: 'Color of solution before titration', type: 'text', required: true, placeholder: 'e.g. colorless' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 4, title: 'Rough Titration', instructions: 'Add NaOH rapidly from the burette while swirling until the pink color persists for about 30 seconds. Record the approximate endpoint volume. This is your rough endpoint.', checkpoint: null, data_entry_fields: [{ label: 'Approximate endpoint (rough run)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 21' }], reflection_prompt: 'Describe the color change you observed. At what point did the pink color first appear?', troubleshooting: 'If you overshoot and the solution turns deep pink/red, you have added too much NaOH. Start over with a fresh HCl sample.' },
    { step_number: 5, title: 'Precise Titration — Trial 1', instructions: 'Refill the burette to 0.00 mL. Add NaOH slowly until one drop causes a permanent faint pink color. Record the final burette reading.', checkpoint: 'The endpoint is reached when a single drop of NaOH causes a pale pink color that persists for 30 seconds. Stop immediately!', data_entry_fields: [{ label: 'Final burette reading (trial 1)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.45' }, { label: 'Volume of NaOH used (trial 1)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.45' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 6, title: 'Precise Titration — Trial 2', instructions: 'Repeat the precise titration with a fresh 25.00 mL HCl sample.', checkpoint: null, data_entry_fields: [{ label: 'Final burette reading (trial 2)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.48' }, { label: 'Volume of NaOH used (trial 2)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.48' }], reflection_prompt: null, troubleshooting: 'Trials should agree within 0.10 mL. If they differ by more, run a third trial.' },
    { step_number: 7, title: 'Precise Titration — Trial 3', instructions: 'Repeat once more to confirm reproducibility.', checkpoint: null, data_entry_fields: [{ label: 'Volume of NaOH used (trial 3)', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.46' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 8, title: 'Calculate Average Volume', instructions: 'Find the mean volume of NaOH used across all concordant trials (within 0.10 mL of each other).', checkpoint: null, data_entry_fields: [{ label: 'Average volume of NaOH', type: 'number', unit: 'mL', min: 0, max: 50, required: true, placeholder: 'e.g. 20.46' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 9, title: 'Calculate Moles of NaOH', instructions: 'Using the given concentration of NaOH (0.100 mol/L), calculate the number of moles of NaOH used at the equivalence point.', checkpoint: null, data_entry_fields: [{ label: 'Concentration of NaOH', type: 'number', unit: 'mol/L', min: 0, max: 2, required: true, placeholder: '0.100' }, { label: 'Moles of NaOH used', type: 'number', unit: 'mol', min: 0, max: 0.01, required: true, placeholder: 'e.g. 0.002046' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 10, title: 'Calculate Moles of HCl', instructions: 'At the equivalence point for HCl + NaOH → NaCl + H₂O, moles of HCl = moles of NaOH. Calculate moles of HCl.', checkpoint: null, data_entry_fields: [{ label: 'Moles of HCl', type: 'number', unit: 'mol', min: 0, max: 0.01, required: true, placeholder: 'e.g. 0.002046' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 11, title: 'Calculate HCl Concentration', instructions: 'Divide moles of HCl by the volume of HCl used (in litres) to find the unknown concentration.', checkpoint: null, data_entry_fields: [{ label: 'Concentration of HCl', type: 'number', unit: 'mol/L', min: 0, max: 2, required: true, placeholder: 'e.g. 0.0818' }], reflection_prompt: 'Your teacher will reveal the actual concentration. Calculate your percent error.', troubleshooting: null },
    { step_number: 12, title: 'Percent Error', instructions: 'Calculate your percent error using the actual HCl concentration provided by your teacher.', checkpoint: null, data_entry_fields: [{ label: 'Actual HCl concentration', type: 'number', unit: 'mol/L', min: 0, max: 2, required: true, placeholder: 'e.g. 0.0820' }, { label: 'Percent error', type: 'number', unit: '%', min: 0, max: 50, required: true, placeholder: 'e.g. 0.2' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 13, title: 'pH at Equivalence Point', instructions: 'Using a pH meter or indicator paper, measure the pH of your endpoint solution. Predict what the pH should be and explain why.', checkpoint: null, data_entry_fields: [{ label: 'Measured pH at equivalence point', type: 'number', unit: '', min: 0, max: 14, required: true, placeholder: 'e.g. 7.0' }, { label: 'Expected pH (explain in reflection)', type: 'text', required: true, placeholder: 'e.g. 7 because NaCl is a neutral salt' }], reflection_prompt: 'Why is the equivalence point of a strong acid / strong base titration at pH 7?', troubleshooting: null },
    { step_number: 14, title: 'Sources of Error', instructions: 'Identify at least three sources of error specific to titration technique. For each, state whether it causes a higher or lower result for [HCl].', checkpoint: null, data_entry_fields: [{ label: 'Error source 1', type: 'text', required: true, placeholder: 'e.g. Overshooting the endpoint' }, { label: 'Error source 2', type: 'text', required: true, placeholder: 'e.g. Air bubbles in burette' }, { label: 'Error source 3', type: 'text', required: true, placeholder: 'e.g. Parallax when reading meniscus' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 15, title: 'Conclusion', instructions: 'Write a conclusion summarizing your titration results, percent error, and what factors most influenced accuracy.', checkpoint: null, data_entry_fields: [{ label: 'Conclusion', type: 'text', required: true, placeholder: 'Write your 4-6 sentence conclusion...' }], reflection_prompt: 'If you were designing a titration for a pharmaceutical quality-control lab, what precautions would you take to improve accuracy?', troubleshooting: null },
  ].map((s) => ({ ...s, lab_id: labId, data_entry_fields: s.data_entry_fields }))
}

// ─── Biology lab: Osmosis (14 steps) ───────────────────────────────────────
function bioSteps(labId) {
  const steps = [
    { step_number: 1,  title: 'Introduction to Osmosis',       instructions: 'Define osmosis and explain the concept of semipermeable membranes. Draw a simple diagram showing water movement across a membrane.', checkpoint: null,                                                                           data_entry_fields: [{ label: 'Definition of osmosis (your words)', type: 'text', required: true, placeholder: 'Osmosis is...' }], reflection_prompt: 'What is the difference between osmosis and diffusion?', troubleshooting: null },
    { step_number: 2,  title: 'Prepare Potato Cylinders',       instructions: 'Use a cork borer to cut 15 uniform potato cylinders approximately 5 cm long. Remove the skin. Pat dry and measure the initial mass of each cylinder.', checkpoint: 'All cylinders should be the same diameter and length. Use calipers if available.',  data_entry_fields: [{ label: 'Average initial mass per cylinder', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 3.2' }], reflection_prompt: null, troubleshooting: 'Potato skin must be removed — it acts as an additional barrier and will skew results.' },
    { step_number: 3,  title: 'Prepare Salt Solutions',         instructions: 'Prepare five 100 mL solutions: 0%, 0.5%, 1.0%, 1.5%, and 2.0% NaCl by dissolving appropriate masses of table salt in distilled water.', checkpoint: null,                                                                   data_entry_fields: [{ label: 'Mass of NaCl for 2.0% solution', type: 'number', unit: 'g', min: 1, max: 5, required: true, placeholder: 'e.g. 2.0' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 4,  title: 'Label and Place Cylinders',       instructions: 'Label 5 beakers with the solution concentration. Place 3 potato cylinders in each beaker. Pour 100 mL of the appropriate solution over each set of cylinders. Record the start time.', checkpoint: null,                   data_entry_fields: [{ label: 'Start time', type: 'text', required: true, placeholder: 'e.g. 10:15 AM' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 5,  title: 'Wait 30 Minutes',                 instructions: 'While the cylinders soak, answer the following questions about osmotic pressure and tonicity.', checkpoint: 'Do not disturb the beakers during the waiting period.',                                                         data_entry_fields: [{ label: 'What is a hypertonic solution?', type: 'text', required: true, placeholder: 'A solution that is...' }, { label: 'What is a hypotonic solution?', type: 'text', required: true, placeholder: 'A solution that is...' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 6,  title: 'Remove and Dry Cylinders',        instructions: 'After 30 minutes, remove the cylinders from each solution. Gently blot each cylinder dry with paper towel. Immediately record the final mass of each cylinder.', checkpoint: null,                                          data_entry_fields: [{ label: 'Final mass — 0% NaCl (average)', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 3.8' }, { label: 'Final mass — 0.5% NaCl', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 3.5' }, { label: 'Final mass — 1.0% NaCl', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 3.2' }, { label: 'Final mass — 1.5% NaCl', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 2.9' }, { label: 'Final mass — 2.0% NaCl', type: 'number', unit: 'g', min: 1, max: 10, required: true, placeholder: 'e.g. 2.5' }], reflection_prompt: null, troubleshooting: 'Work quickly — potato cylinders lose water rapidly once removed from solution.' },
    { step_number: 7,  title: 'Calculate % Change in Mass',      instructions: 'Calculate the percent change in mass for each concentration: [(final − initial) / initial] × 100.', checkpoint: null,                                                                                                   data_entry_fields: [{ label: '% change — 0% NaCl', type: 'number', unit: '%', min: -50, max: 50, required: true, placeholder: 'e.g. +18.75' }, { label: '% change — 0.5% NaCl', type: 'number', unit: '%', min: -50, max: 50, required: true, placeholder: 'e.g. +9.4' }, { label: '% change — 1.0% NaCl', type: 'number', unit: '%', min: -50, max: 50, required: true, placeholder: 'e.g. 0.0' }, { label: '% change — 1.5% NaCl', type: 'number', unit: '%', min: -50, max: 50, required: true, placeholder: 'e.g. -9.4' }, { label: '% change — 2.0% NaCl', type: 'number', unit: '%', min: -50, max: 50, required: true, placeholder: 'e.g. -21.9' }], reflection_prompt: 'At which concentration did the potato cylinders neither gain nor lose mass? What does this tell you about the solute concentration inside potato cells?', troubleshooting: null },
    { step_number: 8,  title: 'Graph Your Results',              instructions: 'On graph paper, plot % change in mass (y-axis) vs NaCl concentration (x-axis). Draw a best-fit line and identify the point where it crosses the x-axis.', checkpoint: 'Call your teacher to check your graph before continuing.',  data_entry_fields: [{ label: 'X-intercept of best-fit line (estimated)', type: 'number', unit: '% NaCl', min: 0, max: 2, required: true, placeholder: 'e.g. 0.95' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 9,  title: 'Determine Isotonic Point',        instructions: 'The x-intercept of your graph represents the concentration at which osmosis is in equilibrium — the isotonic point. This equals the solute concentration inside potato cells.', checkpoint: null,                        data_entry_fields: [{ label: 'Estimated isotonic NaCl concentration of potato tissue', type: 'number', unit: '% NaCl', min: 0, max: 2, required: true, placeholder: 'e.g. 0.95' }], reflection_prompt: 'How does the isotonic concentration of potato cells compare to that of human blood (0.9% NaCl)?', troubleshooting: null },
    { step_number: 10, title: 'Texture Observations',            instructions: 'Describe the texture and firmness of cylinders from each solution. Use the words "turgid", "flaccid", or "plasmolyzed" as appropriate.', checkpoint: null,                                                               data_entry_fields: [{ label: '0% NaCl cylinder texture', type: 'text', required: true, placeholder: 'e.g. turgid and firm' }, { label: '2.0% NaCl cylinder texture', type: 'text', required: true, placeholder: 'e.g. flaccid and limp' }], reflection_prompt: 'What would happen to a plant cell placed in a very salty environment? Use the terms turgor pressure and plasmolysis.', troubleshooting: null },
    { step_number: 11, title: 'Effect on Living Organisms',       instructions: 'Answer the following questions connecting osmosis to real biological systems.', checkpoint: null,                                                                                                                          data_entry_fields: [{ label: 'Why do freshwater fish die in saltwater?', type: 'text', required: true, placeholder: 'Because...' }, { label: 'Why do we add salt to draw water out of cucumbers when making pickles?', type: 'text', required: true, placeholder: 'Salt...' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 12, title: 'Medical Applications',            instructions: 'Explain why IV fluids given to patients must be isotonic and what could happen if a hypotonic or hypertonic solution were used instead.', checkpoint: null,                                                                 data_entry_fields: [{ label: 'What happens if a hypotonic IV solution is given?', type: 'text', required: true, placeholder: 'Red blood cells would...' }, { label: 'What happens if a hypertonic IV solution is given?', type: 'text', required: true, placeholder: 'Red blood cells would...' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 13, title: 'Sources of Error',                instructions: 'Identify at least three sources of error and suggest improvements.', checkpoint: null,                                                                                                                                      data_entry_fields: [{ label: 'Error 1 and improvement', type: 'text', required: true, placeholder: 'e.g. Cylinders not uniform size — use a template' }, { label: 'Error 2 and improvement', type: 'text', required: true, placeholder: 'e.g. Surface water not fully blotted — standardize drying time' }, { label: 'Error 3 and improvement', type: 'text', required: false, placeholder: 'Optional third error...' }], reflection_prompt: null, troubleshooting: null },
    { step_number: 14, title: 'Conclusion',                      instructions: 'Write a structured conclusion: (1) state your hypothesis and whether it was supported, (2) summarize key findings, (3) explain what the isotonic point tells us about potato cell biology, (4) relate your findings to at least one real-world application.', checkpoint: null,  data_entry_fields: [{ label: 'Conclusion (4-6 sentences)', type: 'text', required: true, placeholder: 'In this experiment...' }], reflection_prompt: 'If you were to extend this experiment, what other factors would you test (e.g., temperature, different plant tissue)?', troubleshooting: null },
  ]
  return steps.map((s) => ({ ...s, lab_id: labId, data_entry_fields: s.data_entry_fields }))
}

// ─── Digital Electronics: Logic Gates (12 steps) ───────────────────────────
function eeSteps(labId) {
  return [
    { step_number: 1,  title: 'Binary Number Review',           instructions: 'Convert the following decimal numbers to binary: 5, 9, 12, 15. Show your work.', data_entry_fields: [{ label: '5 in binary', type: 'text', required: true, placeholder: '0101' }, { label: '9 in binary', type: 'text', required: true }, { label: '12 in binary', type: 'text', required: true }, { label: '15 in binary', type: 'text', required: true }] },
    { step_number: 2,  title: 'AND Gate Truth Table',           instructions: 'Complete the truth table for a 2-input AND gate. Enter 0 or 1 for each output.', data_entry_fields: [{ label: 'A=0, B=0: Output', type: 'text', required: true, placeholder: '0 or 1' }, { label: 'A=0, B=1: Output', type: 'text', required: true }, { label: 'A=1, B=0: Output', type: 'text', required: true }, { label: 'A=1, B=1: Output', type: 'text', required: true }] },
    { step_number: 3,  title: 'OR Gate Truth Table',            instructions: 'Complete the truth table for a 2-input OR gate.', data_entry_fields: [{ label: 'A=0, B=0: Output', type: 'text', required: true }, { label: 'A=0, B=1: Output', type: 'text', required: true }, { label: 'A=1, B=0: Output', type: 'text', required: true }, { label: 'A=1, B=1: Output', type: 'text', required: true }] },
    { step_number: 4,  title: 'NOT Gate',                       instructions: 'Complete the truth table for a NOT gate and describe in words what it does.', data_entry_fields: [{ label: 'A=0: Output', type: 'text', required: true }, { label: 'A=1: Output', type: 'text', required: true }, { label: 'Description of NOT gate', type: 'text', required: true, placeholder: 'A NOT gate...' }] },
    { step_number: 5,  title: 'NAND Gate',                      instructions: 'A NAND gate is AND followed by NOT. Complete its truth table.', checkpoint: 'NAND gates are "universal" — any logic function can be built from NANDs alone.', data_entry_fields: [{ label: 'A=0, B=0: Output', type: 'text', required: true }, { label: 'A=0, B=1: Output', type: 'text', required: true }, { label: 'A=1, B=0: Output', type: 'text', required: true }, { label: 'A=1, B=1: Output', type: 'text', required: true }] },
    { step_number: 6,  title: 'NOR Gate',                       instructions: 'Complete the truth table for a NOR gate (OR followed by NOT).', data_entry_fields: [{ label: 'A=0, B=0: Output', type: 'text', required: true }, { label: 'A=0, B=1: Output', type: 'text', required: true }, { label: 'A=1, B=0: Output', type: 'text', required: true }, { label: 'A=1, B=1: Output', type: 'text', required: true }] },
    { step_number: 7,  title: 'XOR Gate',                       instructions: 'Complete the XOR (Exclusive OR) truth table. XOR outputs 1 only when inputs differ.', data_entry_fields: [{ label: 'A=0, B=0: Output', type: 'text', required: true }, { label: 'A=0, B=1: Output', type: 'text', required: true }, { label: 'A=1, B=0: Output', type: 'text', required: true }, { label: 'A=1, B=1: Output', type: 'text', required: true }] },
    { step_number: 8,  title: 'Build a Half Adder',             instructions: 'A half adder adds two single bits. It uses one XOR gate (sum output) and one AND gate (carry output). Complete the truth table for A + B.', checkpoint: 'Call your teacher to verify your half adder circuit before proceeding.', data_entry_fields: [{ label: 'A=0, B=0: Sum, Carry', type: 'text', required: true, placeholder: 'Sum=0, Carry=0' }, { label: 'A=0, B=1: Sum, Carry', type: 'text', required: true }, { label: 'A=1, B=0: Sum, Carry', type: 'text', required: true }, { label: 'A=1, B=1: Sum, Carry', type: 'text', required: true }] },
    { step_number: 9,  title: 'Boolean Algebra',                instructions: 'Simplify the following Boolean expressions: (a) A·A, (b) A+A, (c) A·0, (d) A+1', data_entry_fields: [{ label: 'A·A simplifies to', type: 'text', required: true }, { label: 'A+A simplifies to', type: 'text', required: true }, { label: 'A·0 simplifies to', type: 'text', required: true }, { label: 'A+1 simplifies to', type: 'text', required: true }] },
    { step_number: 10, title: 'Real Breadboard Circuit',        instructions: 'Using the 74HC00 (NAND) chip and LED, build the AND function from two NAND gates. Test with all four input combinations and record LED state (ON/OFF).', data_entry_fields: [{ label: 'A=0, B=0: LED', type: 'text', required: true, placeholder: 'ON or OFF' }, { label: 'A=0, B=1: LED', type: 'text', required: true }, { label: 'A=1, B=0: LED', type: 'text', required: true }, { label: 'A=1, B=1: LED', type: 'text', required: true }] },
    { step_number: 11, title: 'Real-World Applications',        instructions: 'Give three examples of where logic gates are used in real electronic devices.', data_entry_fields: [{ label: 'Application 1', type: 'text', required: true, placeholder: 'e.g. Calculator arithmetic unit' }, { label: 'Application 2', type: 'text', required: true }, { label: 'Application 3', type: 'text', required: true }] },
    { step_number: 12, title: 'Conclusion',                     instructions: 'Write a conclusion explaining (1) how logic gates implement boolean logic, (2) what you found most interesting, and (3) one question you still have.', data_entry_fields: [{ label: 'Conclusion', type: 'text', required: true, placeholder: 'In this lab...' }] },
  ].map((s) => ({ ...s, lab_id: labId, checkpoint: s.checkpoint ?? null, reflection_prompt: s.reflection_prompt ?? null, troubleshooting: s.troubleshooting ?? null, data_entry_fields: s.data_entry_fields }))
}

// ─── CS lab: Sorting Algorithms (11 steps) ─────────────────────────────────
function csSteps(labId) {
  return [
    { step_number: 1,  title: 'What is Sorting?',              data_entry_fields: [{ label: 'Why is sorting useful in computing?', type: 'text', required: true }] },
    { step_number: 2,  title: 'Bubble Sort — Manual Trace',    data_entry_fields: [{ label: 'Trace bubble sort on [5,3,8,1,9,2] — show each pass', type: 'text', required: true, placeholder: 'Pass 1: [3,5,8,1,9,2]...' }] },
    { step_number: 3,  title: 'Bubble Sort — Pseudocode',      data_entry_fields: [{ label: 'Write pseudocode for bubble sort', type: 'text', required: true, placeholder: 'FOR i FROM 0 TO n-1...' }] },
    { step_number: 4,  title: 'Bubble Sort — Count Swaps',     data_entry_fields: [{ label: 'How many swaps to sort [5,3,8,1,9,2]?', type: 'number', unit: 'swaps', min: 0, max: 20, required: true }, { label: 'What is the worst-case number of swaps for n=6?', type: 'number', unit: 'swaps', min: 0, max: 20, required: true }] },
    { step_number: 5,  title: 'Selection Sort — Manual Trace', checkpoint: 'Call your teacher to review your traces so far.', data_entry_fields: [{ label: 'Trace selection sort on [5,3,8,1,9,2]', type: 'text', required: true }] },
    { step_number: 6,  title: 'Insertion Sort',               data_entry_fields: [{ label: 'Trace insertion sort on [5,3,8,1,9,2]', type: 'text', required: true }, { label: 'How many comparisons in total?', type: 'number', unit: 'comparisons', min: 0, max: 30, required: true }] },
    { step_number: 7,  title: 'Measure Runtime (Python)',      data_entry_fields: [{ label: 'Runtime of bubble sort on 1000 random integers', type: 'number', unit: 'ms', min: 0, max: 10000, required: true, placeholder: 'e.g. 450' }, { label: 'Runtime of Python built-in sort', type: 'number', unit: 'ms', min: 0, max: 100, required: true, placeholder: 'e.g. 1' }] },
    { step_number: 8,  title: 'Big-O Notation',               data_entry_fields: [{ label: 'What is the Big-O of bubble sort?', type: 'text', required: true }, { label: 'What is the Big-O of Python\'s Timsort?', type: 'text', required: true }, { label: 'Explain what O(n²) means in plain language', type: 'text', required: true }] },
    { step_number: 9,  title: 'Merge Sort Concept',           data_entry_fields: [{ label: 'Describe the divide-and-conquer strategy of merge sort', type: 'text', required: true }, { label: 'What is the Big-O of merge sort?', type: 'text', required: true }] },
    { step_number: 10, title: 'When to Use Which Algorithm',  data_entry_fields: [{ label: 'When would bubble sort be acceptable?', type: 'text', required: true }, { label: 'What sorting algorithm does Python use and why?', type: 'text', required: true }] },
    { step_number: 11, title: 'Conclusion',                   data_entry_fields: [{ label: 'Conclusion — compare algorithms and what surprised you', type: 'text', required: true }] },
  ].map((s) => ({ ...s, lab_id: labId, checkpoint: s.checkpoint ?? null, reflection_prompt: s.reflection_prompt ?? null, troubleshooting: s.troubleshooting ?? null, instructions: s.instructions ?? `Complete the task for Step ${s.step_number}.`, data_entry_fields: s.data_entry_fields }))
}

// ─── Architecture lab: Load-Bearing Structures (13 steps) ──────────────────
function arcSteps(labId) {
  return [
    { step_number: 1,  title: 'Structural Principles',          data_entry_fields: [{ label: 'What is a load path?', type: 'text', required: true }, { label: 'Name two types of structural loads', type: 'text', required: true }] },
    { step_number: 2,  title: 'Material Selection',             data_entry_fields: [{ label: 'Material chosen and reason', type: 'text', required: true, placeholder: 'e.g. Balsa wood — lightweight and strong for its weight' }], checkpoint: 'Get your material selection approved before building.' },
    { step_number: 3,  title: 'Span Measurement',              data_entry_fields: [{ label: 'Span distance', type: 'number', unit: 'cm', min: 10, max: 60, required: true }, { label: 'Planned bridge width', type: 'number', unit: 'cm', min: 2, max: 15, required: true }] },
    { step_number: 4,  title: 'Design Sketch',                 data_entry_fields: [{ label: 'Describe your structural design (truss, arch, beam, or cable-stay)', type: 'text', required: true }, { label: 'Estimated total mass of structure', type: 'number', unit: 'g', min: 1, max: 500, required: true }] },
    { step_number: 5,  title: 'Build Phase 1: Main Beam',      data_entry_fields: [{ label: 'Actual mass of main beam after cutting', type: 'number', unit: 'g', min: 1, max: 200, required: true }], checkpoint: 'Main beam must span the full gap before continuing.' },
    { step_number: 6,  title: 'Build Phase 2: Cross Bracing',  data_entry_fields: [{ label: 'Number of cross-brace members added', type: 'number', unit: '', min: 0, max: 30, required: true }, { label: 'Total mass after bracing', type: 'number', unit: 'g', min: 1, max: 300, required: true }] },
    { step_number: 7,  title: 'Final Assembly Mass',           data_entry_fields: [{ label: 'Total completed bridge mass', type: 'number', unit: 'g', min: 5, max: 500, required: true }] },
    { step_number: 8,  title: 'Load Test — 100 g',             data_entry_fields: [{ label: 'Bridge survived 100 g?', type: 'text', required: true, placeholder: 'yes or no' }, { label: 'Observed deformation (mm)', type: 'number', unit: 'mm', min: 0, max: 50, required: true }] },
    { step_number: 9,  title: 'Load Test — 250 g',             data_entry_fields: [{ label: 'Bridge survived 250 g?', type: 'text', required: true }, { label: 'Observed deformation (mm)', type: 'number', unit: 'mm', min: 0, max: 50, required: true }] },
    { step_number: 10, title: 'Load Test — 500 g',             data_entry_fields: [{ label: 'Bridge survived 500 g?', type: 'text', required: true }, { label: 'Failure mode if collapsed', type: 'text', required: false, placeholder: 'e.g. tensile failure at joint' }] },
    { step_number: 11, title: 'Calculate Strength-to-Weight',  data_entry_fields: [{ label: 'Maximum load held (g)', type: 'number', unit: 'g', min: 0, max: 5000, required: true }, { label: 'Strength-to-weight ratio (load ÷ bridge mass)', type: 'number', unit: '', min: 0, max: 200, required: true }] },
    { step_number: 12, title: 'Compare with Classmates',       data_entry_fields: [{ label: 'Your strength-to-weight ratio vs. class average', type: 'text', required: true }, { label: 'What design feature gave the best performers their advantage?', type: 'text', required: true }] },
    { step_number: 13, title: 'Conclusion',                    data_entry_fields: [{ label: 'Conclusion — what structural principle was most important?', type: 'text', required: true }] },
  ].map((s) => ({ ...s, lab_id: labId, checkpoint: s.checkpoint ?? null, reflection_prompt: s.reflection_prompt ?? null, troubleshooting: s.troubleshooting ?? null, instructions: s.instructions ?? `Complete the task for ${s.title}.`, data_entry_fields: s.data_entry_fields }))
}

// ─── Carpentry lab: Dovetail Joint (10 steps) ──────────────────────────────
function carpSteps(labId) {
  return [
    { step_number: 1,  title: 'Wood Selection and Grain',      data_entry_fields: [{ label: 'Wood species chosen', type: 'text', required: true, placeholder: 'e.g. pine' }, { label: 'Grain direction observed (describe)', type: 'text', required: true }] },
    { step_number: 2,  title: 'Mark Out the Joint',            data_entry_fields: [{ label: 'Tail board width', type: 'number', unit: 'mm', min: 10, max: 200, required: true }, { label: 'Pin board width', type: 'number', unit: 'mm', min: 10, max: 200, required: true }], checkpoint: 'Get your layout approved by your teacher before cutting.' },
    { step_number: 3,  title: 'Dovetail Angle',                data_entry_fields: [{ label: 'Dovetail angle used', type: 'number', unit: '°', min: 5, max: 20, required: true, placeholder: 'e.g. 10' }, { label: 'Why is this angle appropriate for your wood species?', type: 'text', required: true }] },
    { step_number: 4,  title: 'Saw Tail Board',                data_entry_fields: [{ label: 'Number of tails cut', type: 'number', unit: 'tails', min: 1, max: 10, required: true }, { label: 'How accurate is your cut? (measure gap with feeler gauge)', type: 'number', unit: 'mm', min: 0, max: 3, required: true }] },
    { step_number: 5,  title: 'Chisel Waste from Tails',       data_entry_fields: [{ label: 'Chisel technique used (pare or chop)', type: 'text', required: true }, { label: 'Surface quality of baseline (rate 1-5)', type: 'number', unit: '', min: 1, max: 5, required: true }] },
    { step_number: 6,  title: 'Transfer to Pin Board',         data_entry_fields: [{ label: 'Method used to transfer layout', type: 'text', required: true, placeholder: 'e.g. Knife directly off tail board' }], checkpoint: 'Call your teacher to check your transfer marks before sawing.' },
    { step_number: 7,  title: 'Saw Pin Board',                 data_entry_fields: [{ label: 'Number of pins cut', type: 'number', unit: 'pins', min: 1, max: 10, required: true }, { label: 'Accuracy of saw cuts (gap, mm)', type: 'number', unit: 'mm', min: 0, max: 5, required: true }] },
    { step_number: 8,  title: 'Test Fit',                      data_entry_fields: [{ label: 'Does the joint fit without force?', type: 'text', required: true, placeholder: 'yes / needs adjustment' }, { label: 'Gaps visible? Where?', type: 'text', required: true, placeholder: 'e.g. slight gap at pin shoulder on left side' }] },
    { step_number: 9,  title: 'Glue Up',                       data_entry_fields: [{ label: 'Glue type used', type: 'text', required: true, placeholder: 'e.g. PVA' }, { label: 'Clamping pressure applied (kPa estimate)', type: 'text', required: false, placeholder: 'or describe clamping method' }] },
    { step_number: 10, title: 'Evaluate Finished Joint',       data_entry_fields: [{ label: 'Overall quality score (1-10)', type: 'number', unit: '', min: 1, max: 10, required: true }, { label: 'What would you improve next time?', type: 'text', required: true }, { label: 'Traditional uses of the dovetail joint', type: 'text', required: true }] },
  ].map((s) => ({ ...s, lab_id: labId, checkpoint: s.checkpoint ?? null, reflection_prompt: s.reflection_prompt ?? null, troubleshooting: s.troubleshooting ?? null, instructions: s.instructions ?? `Complete the tasks for ${s.title}.`, data_entry_fields: s.data_entry_fields }))
}

// ─── Statuses for varied lab runs ──────────────────────────────────────────
const STATUSES = ['on_track', 'on_track', 'on_track', 'on_track', 'need_help', 'need_help', 'stuck', 'stuck', 'waiting_for_check', 'waiting_for_check', 'finished_step', 'on_track']

function pickStatus(idx) { return STATUSES[idx % STATUSES.length] }

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const GRADE_DIST = [
  { letter: 'A', total: 95, max: 100 },
  { letter: 'A', total: 92, max: 100 },
  { letter: 'B', total: 85, max: 100 },
  { letter: 'B', total: 82, max: 100 },
  { letter: 'B', total: 78, max: 100 },
  { letter: 'C', total: 72, max: 100 },
  { letter: 'C', total: 68, max: 100 },
  { letter: 'D', total: 58, max: 100 },
]

function pickGrade(idx) { return GRADE_DIST[idx % GRADE_DIST.length] }

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 LabFlow Expanded Seed\n')

  // ── Step 1: Create new auth users ──
  console.log('Step 1: Create new teachers')
  for (const t of NEW_TEACHERS) {
    await step(t.email, () => createUser(t, 'teacher'))
  }

  console.log('\nStep 2: Create new students')
  for (const s of NEW_STUDENTS) {
    await step(s.email, () => createUser(s, 'student'))
  }

  // Approve all teachers
  console.log('\nStep 3: Approve teachers')
  await step('Approve all teachers in org', async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('organization_id', ORG_ID)
      .eq('role', 'teacher')
    if (error) throw error
  })

  // ── Fetch IDs by email ──
  async function id(email) {
    return profileIdByEmail(email)
  }
  async function profileIdByEmail(email) {
    const { data } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (!data) throw new Error(`Profile not found: ${email}`)
    return data.id
  }

  const teacher1Id  = await id('teacher@westlake.demo')
  const teacher2Id  = await id('teacher2@westlake.demo')
  const teacher3Id  = await id('teacher3@westlake.demo')
  const teacher4Id  = await id('teacher4@westlake.demo')

  const s1Id  = await id('student1@westlake.demo')
  const s2Id  = await id('student2@westlake.demo')
  const s3Id  = await id('student3@westlake.demo')
  const s4Id  = await id('student4@westlake.demo')
  const s5Id  = await id('student5@westlake.demo')
  const s6Id  = await id('student6@westlake.demo')
  const s7Id  = await id('student7@westlake.demo')
  const s8Id  = await id('student8@westlake.demo')
  const s9Id  = await id('student9@westlake.demo')
  const s10Id = await id('student10@westlake.demo')
  const s11Id = await id('student11@westlake.demo')
  const s12Id = await id('student12@westlake.demo')
  const s13Id = await id('student13@westlake.demo')
  const s14Id = await id('student14@westlake.demo')
  const s15Id = await id('student15@westlake.demo')
  const s16Id = await id('student16@westlake.demo')
  const s17Id = await id('student17@westlake.demo')
  const s18Id = await id('student18@westlake.demo')
  const s19Id = await id('student19@westlake.demo')
  const s20Id = await id('student20@westlake.demo')
  const s21Id = await id('student21@westlake.demo')
  const s22Id = await id('student22@westlake.demo')
  const s23Id = await id('student23@westlake.demo')
  const s24Id = await id('student24@westlake.demo')
  const s25Id = await id('student25@westlake.demo')
  const s26Id = await id('student26@westlake.demo')
  const s27Id = await id('student27@westlake.demo')
  const s28Id = await id('student28@westlake.demo')
  const s29Id = await id('student29@westlake.demo')
  const s30Id = await id('student30@westlake.demo')

  // ── Step 4: Create 6 new classes ──
  console.log('\nStep 4: Classes')
  const classRows = [
    { id: CLASS4_ID, name: 'Period 2 — Chemistry',           period: '2', teacher_id: teacher2Id },
    { id: CLASS5_ID, name: 'Period 4 — Biology',             period: '4', teacher_id: teacher2Id },
    { id: CLASS6_ID, name: 'Period 1 — Digital Electronics', period: '1', teacher_id: teacher3Id },
    { id: CLASS7_ID, name: 'Period 6 — Computer Science',    period: '6', teacher_id: teacher3Id },
    { id: CLASS8_ID, name: 'Period 7 — Architecture',        period: '7', teacher_id: teacher4Id },
    { id: CLASS9_ID, name: 'Period 8 — Carpentry',           period: '8', teacher_id: teacher4Id },
  ]
  for (const c of classRows) {
    await step(c.name, async () => {
      const { error } = await supabase.from('classes').upsert({
        id: c.id, organization_id: ORG_ID, teacher_id: c.teacher_id, created_by: c.teacher_id,
        name: c.name, description: `${c.name} class at Westlake Science Academy.`,
        period: c.period, school_year: '2025-2026', archived: false,
      }, { onConflict: 'id' })
      if (error) throw error
      // class_teachers
      await supabase.from('class_teachers').upsert({
        class_id: c.id, teacher_id: c.teacher_id, class_role: 'lead_teacher',
        can_manage_roster: true, can_manage_assignments: true,
        can_manage_grades: true, can_edit_class_settings: true, added_by: c.teacher_id,
      }, { onConflict: 'class_id,teacher_id' })
    })
  }

  // ── Step 5: Enrollments ──
  console.log('\nStep 5: Enrollments')
  const enrollmentMap = {
    [CLASS4_ID]: [s7Id,  s8Id,  s9Id,  s10Id, s11Id, s12Id, s13Id, s14Id],          // Chemistry (8)
    [CLASS5_ID]: [s15Id, s16Id, s17Id, s18Id, s19Id, s20Id, s21Id],                  // Biology (7)
    [CLASS6_ID]: [s22Id, s23Id, s24Id, s25Id, s26Id, s27Id],                         // Digital Electronics (6)
    [CLASS7_ID]: [s28Id, s29Id, s30Id, s8Id,  s12Id, s18Id, s25Id],                  // CS (7, some overlap)
    [CLASS8_ID]: [s9Id,  s13Id, s16Id, s22Id, s27Id, s30Id],                         // Architecture (6)
    [CLASS9_ID]: [s7Id,  s10Id, s14Id, s17Id, s20Id, s23Id, s26Id, s29Id],           // Carpentry (8)
  }
  for (const [classId, studentIds] of Object.entries(enrollmentMap)) {
    await step(`Enroll into ${classId.slice(0, 12)}`, async () => {
      await supabase.from('class_enrollments').delete().eq('class_id', classId)
      const rows = studentIds.map((sid) => ({ class_id: classId, student_id: sid, status: 'active' }))
      const { error } = await supabase.from('class_enrollments').insert(rows)
      if (error) throw error
    })
  }

  // ── Step 6: Expand density lab (add steps 5-12) ──
  console.log('\nStep 6: Expand density lab to 12 steps')
  await step('Add density steps 5-12', async () => {
    for (const s of DENSITY_EXTRA_STEPS) {
      await supabase.from('lab_steps').upsert({ ...s, lab_id: LAB1_ID }, { onConflict: 'id' })
    }
  })

  // ── Step 7: Create 6 new labs ──
  console.log('\nStep 7: New labs')
  const labDefs = [
    { id: LAB_CHEM_ID, teacher_id: teacher2Id, title: 'Acid-Base Titration', overview: 'Students use acid-base titration to determine the unknown concentration of hydrochloric acid by titrating against a standard NaOH solution, using phenolphthalein as the indicator.', estimated_minutes: 75, objectives: ['Perform a precise acid-base titration', 'Use indicator color change to identify the equivalence point', 'Calculate unknown acid concentration from titration data', 'Evaluate precision through concordant trials', 'Calculate percent error against a known standard'], standards: ['NGSS HS-PS1-7', 'AP Chemistry Big Idea 3'], safety_notes: 'Wear goggles, gloves, and lab coat at all times. NaOH is corrosive — rinse spills immediately with water.' },
    { id: LAB_BIO_ID,  teacher_id: teacher2Id, title: 'Osmosis in Potato Tissue', overview: 'Students investigate osmosis by measuring mass changes in potato cylinders immersed in NaCl solutions of varying concentration, then determine the isotonic point of potato cells.', estimated_minutes: 60, objectives: ['Investigate osmosis across a semi-permeable membrane', 'Measure and calculate percent change in mass', 'Determine the isotonic concentration of potato cell cytoplasm', 'Relate osmosis to real biological systems', 'Graph and interpret biological data'], standards: ['NGSS HS-LS1-2', 'AP Biology Big Idea 2'], safety_notes: 'Use care with cork borers and knives. Blot cylinders thoroughly before massing.' },
    { id: LAB_EE_ID,   teacher_id: teacher3Id, title: 'Logic Gate Truth Tables', overview: 'Students systematically build and verify truth tables for all basic logic gates, then construct and test a half adder circuit on a breadboard, connecting binary logic to physical electronics.', estimated_minutes: 90, objectives: ['Complete truth tables for AND, OR, NOT, NAND, NOR, XOR', 'Understand Boolean algebra simplification rules', 'Build a half adder from logic gates', 'Test physical circuit and verify against truth table', 'Apply logic gates to real computing contexts'], standards: ['CSTA K-12 CS Framework 3A-DA-09', 'IEEE Digital Circuits Standards'], safety_notes: 'Keep power disconnected when changing circuit connections. Do not exceed 5V supply voltage.' },
    { id: LAB_CS_ID,   teacher_id: teacher3Id, title: 'Sorting Algorithm Analysis', overview: 'Students manually trace and implement bubble sort, selection sort, and insertion sort, measure empirical runtime differences, and explore the concept of algorithmic complexity through Big-O notation.', estimated_minutes: 80, objectives: ['Manually trace multiple sorting algorithms', 'Write pseudocode for sorting algorithms', 'Measure and compare empirical runtimes', 'Understand Big-O notation', 'Explain why algorithm choice matters in practice'], standards: ['CSTA K-12 CS Framework 3B-AP-10', 'APCS Principles'], safety_notes: 'No physical safety concerns. Save your code frequently.' },
    { id: LAB_ARC_ID,  teacher_id: teacher4Id, title: 'Load-Bearing Bridge Structures', overview: 'Students design, build, and test a small bridge structure using balsa wood, applying principles of structural engineering to maximize strength-to-weight ratio while spanning a 30 cm gap.', estimated_minutes: 120, objectives: ['Apply structural principles: compression, tension, load paths', 'Design and build a bridge spanning 30 cm', 'Progressively load-test to failure', 'Calculate and compare strength-to-weight ratios', 'Evaluate design decisions through evidence'], standards: ['NGSS HS-ETS1-2', 'Architecture CTE Standards'], safety_notes: 'Use cutting mats and protect fingers when using craft knives. Wear safety glasses during load testing.' },
    { id: LAB_CARP_ID, teacher_id: teacher4Id, title: 'Dovetail Joint Woodworking', overview: 'Students learn to lay out, saw, and fit a traditional hand-cut dovetail joint — one of woodworking\'s most elegant and strong joinery techniques — developing precision marking, sawing, and chiseling skills.', estimated_minutes: 150, objectives: ['Understand wood grain and species selection', 'Mark and cut accurate dovetail tails and pins', 'Achieve a tight-fitting joint through precise technique', 'Evaluate joint quality against professional standards', 'Connect traditional joinery to modern applications'], standards: ['Carpentry CTE Standards', 'OSHA Wood Shop Safety Guidelines'], safety_notes: 'Always cut away from your body. Keep chisels sharp — dull chisels require more force and slip. Wear safety glasses during sawing.' },
  ]

  for (const lab of labDefs) {
    await step(lab.title, async () => {
      const { error } = await supabase.from('labs').upsert({
        id: lab.id, organization_id: ORG_ID, teacher_id: lab.teacher_id,
        title: lab.title, overview: lab.overview, estimated_minutes: lab.estimated_minutes,
        objectives: lab.objectives, standards: lab.standards ?? [],
        materials_list: [], safety_notes: lab.safety_notes, background: null,
        teacher_notes: null, status: 'published', ai_generated: false,
      }, { onConflict: 'id' })
      if (error) throw error
    })
  }

  // ── Step 8: Insert lab steps ──
  console.log('\nStep 8: Lab steps')
  const allNewSteps = [
    ...chemSteps(LAB_CHEM_ID),
    ...bioSteps(LAB_BIO_ID),
    ...eeSteps(LAB_EE_ID),
    ...csSteps(LAB_CS_ID),
    ...arcSteps(LAB_ARC_ID),
    ...carpSteps(LAB_CARP_ID),
  ]
  for (const s of allNewSteps) {
    await step(`${s.lab_id.slice(0,12)} step ${s.step_number}`, async () => {
      const { error } = await supabase.from('lab_steps').upsert(s, { onConflict: 'lab_id,step_number' })
      if (error) throw error
    })
  }

  // ── Step 9: Lab assignments ──
  console.log('\nStep 9: Assignments')
  const assignDefs = [
    { id: ASSIGN_CHEM_ID, lab_id: LAB_CHEM_ID, class_id: CLASS4_ID, teacher_id: teacher2Id },
    { id: ASSIGN_BIO_ID,  lab_id: LAB_BIO_ID,  class_id: CLASS5_ID, teacher_id: teacher2Id },
    { id: ASSIGN_EE_ID,   lab_id: LAB_EE_ID,   class_id: CLASS6_ID, teacher_id: teacher3Id },
    { id: ASSIGN_CS_ID,   lab_id: LAB_CS_ID,   class_id: CLASS7_ID, teacher_id: teacher3Id },
    { id: ASSIGN_ARC_ID,  lab_id: LAB_ARC_ID,  class_id: CLASS8_ID, teacher_id: teacher4Id },
    { id: ASSIGN_CARP_ID, lab_id: LAB_CARP_ID, class_id: CLASS9_ID, teacher_id: teacher4Id },
  ]
  for (const a of assignDefs) {
    await step(a.id.slice(0, 14), async () => {
      const { error } = await supabase.from('lab_assignments').upsert({
        id: a.id, lab_id: a.lab_id, class_id: a.class_id,
        assigned_by: a.teacher_id, due_date: daysFromNow(10), instructions_override: null,
      }, { onConflict: 'id' })
      if (error) throw error
    })
  }

  // ── Step 10: Student lab runs (active, varied steps/statuses) ──
  console.log('\nStep 10: Student lab runs')

  // Earth science density lab — existing 6 students already seeded by seed-demo.mjs
  // Expand the density runs to more steps and vary current_step
  const densityStudents = [s1Id, s2Id, s3Id, s4Id, s5Id, s6Id]
  for (let i = 0; i < densityStudents.length; i++) {
    const sid = densityStudents[i]
    const step_num = Math.min(i + 1, 12)
    await step(`density run s${i + 1}`, async () => {
      await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN1_ID, student_id: sid, lab_id: LAB1_ID,
        current_step: step_num, prelab_completed: true, status: pickStatus(i),
        started_at: daysAgo(3), completed_at: (i === 0) ? daysAgo(1) : null,
      }, { onConflict: 'assignment_id,student_id' })
    })
  }

  // Chemistry titration runs (8 students, steps 1-12 of 15)
  const chemStudents = enrollmentMap[CLASS4_ID]
  for (let i = 0; i < chemStudents.length; i++) {
    const sid = chemStudents[i]
    const step_num = Math.max(1, Math.min(1 + i * 2, 14))
    await step(`chem run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_CHEM_ID, student_id: sid, lab_id: LAB_CHEM_ID,
        current_step: step_num, prelab_completed: step_num > 2, status: pickStatus(i + 1),
        started_at: daysAgo(2), completed_at: (i === 0) ? daysAgo(0) : null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // Biology osmosis runs (7 students)
  const bioStudents = enrollmentMap[CLASS5_ID]
  for (let i = 0; i < bioStudents.length; i++) {
    const sid = bioStudents[i]
    const step_num = Math.max(1, Math.min(2 + i * 2, 13))
    await step(`bio run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_BIO_ID, student_id: sid, lab_id: LAB_BIO_ID,
        current_step: step_num, prelab_completed: step_num > 3, status: pickStatus(i + 2),
        started_at: daysAgo(2), completed_at: null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // Digital Electronics runs (6 students)
  const eeStudents = enrollmentMap[CLASS6_ID]
  for (let i = 0; i < eeStudents.length; i++) {
    const sid = eeStudents[i]
    const step_num = Math.max(1, Math.min(3 + i * 2, 11))
    await step(`ee run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_EE_ID, student_id: sid, lab_id: LAB_EE_ID,
        current_step: step_num, prelab_completed: true, status: pickStatus(i + 3),
        started_at: daysAgo(1), completed_at: null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // CS runs (7 students)
  const csStudents = enrollmentMap[CLASS7_ID]
  for (let i = 0; i < csStudents.length; i++) {
    const sid = csStudents[i]
    const step_num = Math.max(1, Math.min(1 + i * 1, 10))
    await step(`cs run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_CS_ID, student_id: sid, lab_id: LAB_CS_ID,
        current_step: step_num, prelab_completed: step_num > 2, status: pickStatus(i + 4),
        started_at: daysAgo(1), completed_at: null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // Architecture runs (6 students)
  const arcStudents = enrollmentMap[CLASS8_ID]
  for (let i = 0; i < arcStudents.length; i++) {
    const sid = arcStudents[i]
    const step_num = Math.max(1, Math.min(2 + i * 2, 12))
    await step(`arc run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_ARC_ID, student_id: sid, lab_id: LAB_ARC_ID,
        current_step: step_num, prelab_completed: step_num > 1, status: pickStatus(i + 5),
        started_at: daysAgo(2), completed_at: null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // Carpentry runs (8 students)
  const carpStudents = enrollmentMap[CLASS9_ID]
  for (let i = 0; i < carpStudents.length; i++) {
    const sid = carpStudents[i]
    const step_num = Math.max(1, Math.min(1 + i, 9))
    await step(`carp run s${i}`, async () => {
      const { error } = await supabase.from('student_lab_runs').upsert({
        assignment_id: ASSIGN_CARP_ID, student_id: sid, lab_id: LAB_CARP_ID,
        current_step: step_num, prelab_completed: step_num > 2, status: pickStatus(i + 6),
        started_at: daysAgo(3), completed_at: null,
      }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    })
  }

  // ── Step 11: Historical completed+graded assignments ──
  console.log('\nStep 11: Historical completed runs')

  // Reuse density lab as the "historical" lab for all classes (simple approach)
  const histAssignDefs = [
    { id: HIST_CHEM_ID, lab_id: LAB1_ID, class_id: CLASS4_ID, teacher_id: teacher2Id, students: chemStudents },
    { id: HIST_BIO_ID,  lab_id: LAB1_ID, class_id: CLASS5_ID, teacher_id: teacher2Id, students: bioStudents },
    { id: HIST_EE_ID,   lab_id: LAB1_ID, class_id: CLASS6_ID, teacher_id: teacher3Id, students: eeStudents },
  ]

  for (const ha of histAssignDefs) {
    await step(`hist assign ${ha.id.slice(0,14)}`, async () => {
      const { error } = await supabase.from('lab_assignments').upsert({
        id: ha.id, lab_id: ha.lab_id, class_id: ha.class_id,
        assigned_by: ha.teacher_id,
        due_date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
        instructions_override: null,
      }, { onConflict: 'id' })
      if (error) throw error
    })

    // Rubric items for this historical lab
    const haIdx = histAssignDefs.indexOf(ha)
    const haH = haIdx.toString(16) // 1 char: 0, 1, 2
    const rubricIds = [
      `ab000001-${haH}000-0000-0000-000000000001`,
      `ab000002-${haH}000-0000-0000-000000000001`,
      `ab000003-${haH}000-0000-0000-000000000001`,
    ]
    await step(`rubric for ${ha.id.slice(0,14)}`, async () => {
      await supabase.from('rubric_items').upsert([
        { id: rubricIds[0], lab_id: ha.lab_id, position: 1, title: 'Data Collection', description: 'Accurate measurements with correct units', max_points: 30 },
        { id: rubricIds[1], lab_id: ha.lab_id, position: 2, title: 'Calculations', description: 'Correct density formula applied', max_points: 40 },
        { id: rubricIds[2], lab_id: ha.lab_id, position: 3, title: 'Error Analysis', description: 'Thoughtful identification of error sources', max_points: 30 },
      ], { onConflict: 'id' })
    })

    // Historical runs — all completed and graded
    for (let i = 0; i < ha.students.length; i++) {
      const sid = ha.students[i]
      const iHex = i.toString(16).padStart(2, '0')
      const runId = `dddddddd-${haH}${iHex}0-0000-0000-000000000001`
      const gradeId = `eeeeeeee-${haH}${iHex}0-0000-0000-000000000001`
      const g = pickGrade(i)
      const completedAt = daysAgo(55 + i)
      await step(`hist run ${runId.slice(0, 12)}`, async () => {
        const { error: runErr } = await supabase.from('student_lab_runs').upsert({
          id: runId, assignment_id: ha.id, student_id: sid, lab_id: ha.lab_id,
          current_step: 12, prelab_completed: true, status: 'on_track',
          started_at: daysAgo(60 + i), completed_at: completedAt,
        }, { onConflict: 'id' })
        if (runErr) throw runErr

        // Grade
        await supabase.from('student_grades').upsert({
          id: gradeId,
          lab_run_id: runId, teacher_id: ha.teacher_id,
          letter_grade: g.letter, total_score: g.total, max_score: g.max,
          overall_comment: g.letter === 'A' ? 'Excellent work! Great precision.' : g.letter === 'B' ? 'Good effort. Watch significant figures.' : 'Needs improvement in error analysis.',
          graded_at: daysAgo(50 + i),
        }, { onConflict: 'id' })

        // Rubric scores
        const pts = [g.total * 0.3, g.total * 0.4, g.total * 0.3].map(Math.round)
        for (let r = 0; r < rubricIds.length; r++) {
          const rHex = r.toString(16)
          await supabase.from('rubric_scores').upsert({
            id: `ffffffff-${haH}${iHex}${rHex}-0000-0000-000000000001`,
            lab_run_id: runId, rubric_item_id: rubricIds[r],
            teacher_score: pts[r], teacher_comment: null,
          }, { onConflict: 'id' })
        }
      })
    }
  }

  console.log('\n✅ Expanded seed complete!\n')
  console.log('Summary:')
  console.log('  New teachers:   3  (teacher2-4@westlake.demo)')
  console.log('  New students:   24 (student7-30@westlake.demo)')
  console.log('  New classes:    6  (Chemistry, Biology, Dig.Electronics, CS, Architecture, Carpentry)')
  console.log('  New labs:       6  (10-15 steps each)')
  console.log('  Density lab:    expanded to 12 steps')
  console.log('  Active runs:    ~42 students at various steps')
  console.log('  Historical:     3 old assignments fully graded')
  console.log('\nAll passwords: LabFlow2025!')
}

main().catch((e) => { console.error('\n❌ Seed failed:', e.message); process.exit(1) })
