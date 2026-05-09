import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LabStep, PreLabQuestion, DataEntryField, StepDataValue } from '@/types/app'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ labRunId: string }> }
) {
  const { labRunId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (!profile) return new NextResponse('Forbidden', { status: 403 })

  const isTeacher = ['teacher', 'school_admin', 'super_admin'].includes(profile.role)
  const isStudent = profile.role === 'student'

  if (!isTeacher && !isStudent) return new NextResponse('Forbidden', { status: 403 })

  const { data: run } = await db
    .from('student_lab_runs')
    .select('*, labs(*, lab_steps(*), pre_lab_questions(*)), profiles:student_id(first_name, last_name)')
    .eq('id', labRunId)
    .single()

  if (!run) return new NextResponse('Not found', { status: 404 })

  if (isStudent && run.student_id !== user.id) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const [{ data: stepResponsesRaw }, { data: preLabResponsesRaw }] = await Promise.all([
    db.from('step_responses').select('*').eq('lab_run_id', labRunId),
    db.from('pre_lab_responses').select('*').eq('lab_run_id', labRunId),
  ])

  const stepResponses: Record<string, { data_values: Record<string, StepDataValue>; reflection_text: string | null }> = {}
  for (const r of stepResponsesRaw ?? []) {
    stepResponses[r.step_id] = {
      data_values: (r.data_values as Record<string, StepDataValue>) ?? {},
      reflection_text: r.reflection_text ?? null,
    }
  }

  const preLabResponses: Record<string, string> = {}
  for (const r of preLabResponsesRaw ?? []) {
    preLabResponses[r.question_id] = r.response_text ?? ''
  }

  const lab = run.labs
  const studentProfile = run.profiles as { first_name: string; last_name: string } | null
  const studentName = studentProfile
    ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim()
    : 'Student'

  const steps: LabStep[] = (lab?.lab_steps ?? []).sort(
    (a: LabStep, b: LabStep) => a.step_number - b.step_number
  )
  const preLabQuestions: PreLabQuestion[] = (lab?.pre_lab_questions ?? []).sort(
    (a: PreLabQuestion, b: PreLabQuestion) => a.position - b.position
  )

  const completedAt = run.completed_at
    ? new Date(run.completed_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const html = buildPrintHtml(lab, steps, preLabQuestions, stepResponses, preLabResponses, studentName, completedAt)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

function renderPreLabQuestion(
  q: PreLabQuestion,
  idx: number,
  answer: string | undefined
): string {
  const hasAnswer = answer !== undefined && answer !== ''
  let answerHtml = ''

  if (q.question_type === 'multiple_choice' && q.options?.length) {
    answerHtml = `<div class="options">${q.options
      .map((opt) => {
        const selected = answer === opt
        return `<div class="option ${selected ? 'selected' : ''}">
          <span class="bubble ${selected ? 'filled' : ''}"></span>${esc(opt)}
        </div>`
      })
      .join('')}</div>`
  } else if (q.question_type === 'true_false') {
    answerHtml = `<div class="options">
      ${['True', 'False'].map((opt) => {
        const selected = answer?.toLowerCase() === opt.toLowerCase()
        return `<div class="option ${selected ? 'selected' : ''}">
          <span class="bubble ${selected ? 'filled' : ''}"></span>${opt}
        </div>`
      }).join('')}
    </div>`
  } else if (hasAnswer) {
    answerHtml = `<div class="student-response">${esc(answer)}</div>`
  } else {
    answerHtml = `<div class="blank-response"></div>`
  }

  return `<div class="pre-lab-question">
    <p class="question-text"><strong>${idx + 1}.</strong> ${esc(q.question_text)}</p>
    ${answerHtml}
  </div>`
}

function renderDataTable(
  fields: DataEntryField[],
  dataValues: Record<string, StepDataValue>
): string {
  if (!fields.length) return ''
  const hasAnyData = fields.some((f) => dataValues[f.label] !== undefined && dataValues[f.label] !== null && dataValues[f.label] !== '')

  return `<table class="data-table">
    <thead>
      <tr>
        ${fields.map((f) => `<th>${esc(f.label)}${f.unit ? ` (${esc(f.unit)})` : ''}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr class="${hasAnyData ? 'student-row' : ''}">
        ${fields.map((f) => {
          const val = dataValues[f.label]
          const hasVal = val !== undefined && val !== null && val !== ''
          return `<td class="${hasVal ? 'student-cell' : ''}">${hasVal ? esc(String(val)) : ''}</td>`
        }).join('')}
      </tr>
      <tr><td colspan="${fields.length}"></td></tr>
      <tr><td colspan="${fields.length}"></td></tr>
    </tbody>
  </table>`
}

function renderStep(
  step: LabStep,
  idx: number,
  response: { data_values: Record<string, StepDataValue>; reflection_text: string | null } | undefined
): string {
  const fields: DataEntryField[] = (step.data_entry_fields as DataEntryField[]) ?? []
  const dataValues = response?.data_values ?? {}
  const reflection = response?.reflection_text ?? null

  return `<div class="step">
    <div class="step-header">
      <span class="step-number">Step ${idx + 1}</span>
      <span class="step-title">${esc(step.title)}</span>
    </div>
    <div class="step-instructions">${esc(step.instructions)}</div>
    ${fields.length ? `<div class="section-label">Data Collection</div>${renderDataTable(fields, dataValues)}` : ''}
    ${step.checkpoint ? `<div class="checkpoint"><strong>Checkpoint:</strong> ${esc(step.checkpoint)}</div>` : ''}
    ${step.reflection_prompt ? `
      <div class="section-label">Reflection</div>
      <p class="reflection-prompt">${esc(step.reflection_prompt)}</p>
      ${reflection
        ? `<div class="student-response">${esc(reflection)}</div>`
        : `<div class="blank-response"></div>`
      }` : ''}
  </div>`
}

function buildPrintHtml(
  lab: {
    title: string
    overview: string | null
    objectives: string[]
    standards: string[]
    materials_list: string[]
    safety_notes: string | null
    background: string | null
    estimated_minutes: number | null
  },
  steps: LabStep[],
  preLabQuestions: PreLabQuestion[],
  stepResponses: Record<string, { data_values: Record<string, StepDataValue>; reflection_text: string | null }>,
  preLabResponses: Record<string, string>,
  studentName: string,
  completedAt: string | null
): string {
  const materialsHtml = lab.materials_list?.length
    ? `<section>
        <h2>Materials</h2>
        <ul>${lab.materials_list.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      </section>`
    : ''

  const safetyHtml = lab.safety_notes
    ? `<section>
        <h2>Safety Notes</h2>
        <div class="safety-box">${esc(lab.safety_notes)}</div>
      </section>`
    : ''

  const backgroundHtml = lab.background
    ? `<section>
        <h2>Background</h2>
        <p>${esc(lab.background)}</p>
      </section>`
    : ''

  const objectivesHtml = lab.objectives?.length
    ? `<section>
        <h2>Learning Objectives</h2>
        <ul>${lab.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </section>`
    : ''

  const preLabHtml = preLabQuestions.length
    ? `<section class="pre-lab">
        <h2>Pre-Lab Questions</h2>
        ${preLabQuestions.map((q, i) => renderPreLabQuestion(q, i, preLabResponses[q.id])).join('')}
      </section>`
    : ''

  const procedureHtml = steps.length
    ? `<section class="procedure">
        <h2>Procedure</h2>
        ${steps.map((s, i) => renderStep(s, i, stepResponses[s.id])).join('')}
      </section>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(lab.title)} — ${esc(studentName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 11pt; color: #111; background: #fff; }
    .page { max-width: 750px; margin: 0 auto; padding: 28px 32px; }

    .print-bar {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ddd;
    }
    .print-bar button {
      font-size: 13px;
      padding: 7px 18px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #ccc;
      background: #f5f5f5;
    }
    .print-bar button.primary {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }

    /* Legend */
    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9pt;
      color: #555;
      margin-bottom: 18px;
      padding: 7px 12px;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      background: #eff6ff;
    }
    .legend-swatch {
      width: 16px;
      height: 16px;
      background: #dbeafe;
      border: 1.5px solid #93c5fd;
      border-radius: 3px;
      flex-shrink: 0;
    }

    /* Header */
    .lab-header { margin-bottom: 16px; border-bottom: 2px solid #111; padding-bottom: 12px; }
    .lab-title { font-size: 20pt; font-weight: bold; margin-bottom: 4px; }
    .lab-meta { font-size: 9pt; color: #555; display: flex; gap: 16px; flex-wrap: wrap; }

    .student-header {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 10pt;
      margin-bottom: 20px;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f9fafb;
    }
    .student-header .field { display: flex; gap: 6px; align-items: center; }
    .student-header .label { color: #6b7280; font-size: 9pt; }
    .student-header .value { font-weight: bold; }

    section { margin-bottom: 20px; }
    h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
    p { line-height: 1.6; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; line-height: 1.5; }

    .safety-box { border: 1.5px solid #d97706; background: #fef9ee; border-radius: 4px; padding: 10px 14px; font-size: 10pt; line-height: 1.6; }

    /* Pre-lab */
    .pre-lab { page-break-before: auto; }
    .pre-lab-question { margin-bottom: 18px; }
    .question-text { margin-bottom: 6px; line-height: 1.5; }
    .options { display: flex; flex-direction: column; gap: 4px; padding-left: 16px; }
    .option { display: flex; align-items: center; gap: 8px; font-size: 10.5pt; }
    .option.selected { font-weight: bold; }
    .bubble { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #555; border-radius: 50%; flex-shrink: 0; }
    .bubble.filled { background: #2563eb; border-color: #2563eb; }

    /* Student response boxes */
    .student-response {
      background: #dbeafe;
      border: 1.5px solid #93c5fd;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 10.5pt;
      line-height: 1.6;
      min-height: 36px;
      position: relative;
    }
    .student-response::before {
      content: "Student response";
      display: block;
      font-size: 7.5pt;
      font-style: italic;
      color: #1d4ed8;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .blank-response {
      border-bottom: 1px solid #aaa;
      margin-bottom: 14px;
      height: 20px;
    }

    /* Steps */
    .step { margin-bottom: 24px; page-break-inside: avoid; }
    .step-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
    .step-number { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
    .step-title { font-size: 11.5pt; font-weight: bold; }
    .step-instructions { line-height: 1.65; margin-bottom: 10px; }
    .section-label { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em; color: #555; margin-bottom: 5px; margin-top: 10px; }
    .checkpoint { border-left: 3px solid #2563eb; padding: 7px 12px; background: #eff6ff; font-size: 10pt; margin: 10px 0; border-radius: 0 4px 4px 0; }
    .reflection-prompt { font-style: italic; color: #444; margin-bottom: 6px; font-size: 10.5pt; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
    .data-table th { background: #f3f4f6; border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 9.5pt; }
    .data-table td { border: 1px solid #ccc; padding: 10px; }
    /* Highlighted student data cells */
    .data-table .student-cell { background: #dbeafe; border-color: #93c5fd; font-weight: bold; }
    .data-table .student-row .student-cell { color: #1e40af; }

    @media print {
      .print-bar { display: none; }
      body { font-size: 10.5pt; }
      .page { padding: 0; max-width: 100%; }
      .step { page-break-inside: avoid; }
      .pre-lab { page-break-before: always; }
      .procedure { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="print-bar">
      <button onclick="window.close()">Close</button>
      <button class="primary" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="lab-header">
      <div class="lab-title">${esc(lab.title)}</div>
      <div class="lab-meta">
        ${lab.estimated_minutes ? `<span>&#128337; ${lab.estimated_minutes} min</span>` : ''}
        ${steps.length ? `<span>&#9879; ${steps.length} steps</span>` : ''}
        ${lab.standards?.length ? `<span>Standards: ${lab.standards.map(esc).join(', ')}</span>` : ''}
      </div>
    </div>

    <div class="student-header">
      <div class="field"><span class="label">Student:</span><span class="value">${esc(studentName)}</span></div>
      ${completedAt ? `<div class="field"><span class="label">Completed:</span><span class="value">${esc(completedAt)}</span></div>` : ''}
    </div>

    <div class="legend">
      <div class="legend-swatch"></div>
      Highlighted cells and boxes show the student&apos;s recorded data and responses.
    </div>

    ${lab.overview ? `<section><p>${esc(lab.overview)}</p></section>` : ''}
    ${objectivesHtml}
    ${materialsHtml}
    ${safetyHtml}
    ${backgroundHtml}
    ${preLabHtml}
    ${procedureHtml}
  </div>
</body>
</html>`
}
