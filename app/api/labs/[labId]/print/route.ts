import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LabStep, PreLabQuestion, DataEntryField } from '@/types/app'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  const { labId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'school_admin', 'super_admin'].includes(profile.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: lab } = await db
    .from('labs')
    .select('*, lab_steps(*), pre_lab_questions(*)')
    .eq('id', labId)
    .single()

  if (!lab) {
    return new NextResponse('Not found', { status: 404 })
  }

  const steps: LabStep[] = (lab.lab_steps ?? []).sort(
    (a: LabStep, b: LabStep) => a.step_number - b.step_number
  )
  const preLabQuestions: PreLabQuestion[] = (lab.pre_lab_questions ?? []).sort(
    (a: PreLabQuestion, b: PreLabQuestion) => a.position - b.position
  )

  const html = buildPrintHtml(lab, steps, preLabQuestions)

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

function renderPreLabQuestion(q: PreLabQuestion, idx: number): string {
  let answerHtml = ''

  if (q.question_type === 'multiple_choice' && q.options?.length) {
    answerHtml = `<div class="options">${q.options
      .map((opt) => `<div class="option"><span class="bubble"></span>${esc(opt)}</div>`)
      .join('')}</div>`
  } else if (q.question_type === 'true_false') {
    answerHtml = `<div class="options">
      <div class="option"><span class="bubble"></span>True</div>
      <div class="option"><span class="bubble"></span>False</div>
    </div>`
  } else {
    answerHtml = `<div class="answer-lines">
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
    </div>`
  }

  return `<div class="pre-lab-question">
    <p class="question-text"><strong>${idx + 1}.</strong> ${esc(q.question_text)}</p>
    ${answerHtml}
  </div>`
}

function renderDataTable(fields: DataEntryField[]): string {
  if (!fields.length) return ''
  return `<table class="data-table">
    <thead>
      <tr>
        ${fields.map((f) => `<th>${esc(f.label)}${f.unit ? ` (${esc(f.unit)})` : ''}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${[1, 2, 3].map(() => `<tr>${fields.map(() => '<td></td>').join('')}</tr>`).join('')}
    </tbody>
  </table>`
}

function renderStep(step: LabStep, idx: number): string {
  const fields: DataEntryField[] = (step.data_entry_fields as DataEntryField[]) ?? []

  return `<div class="step">
    <div class="step-header">
      <span class="step-number">Step ${idx + 1}</span>
      <span class="step-title">${esc(step.title)}</span>
    </div>
    <div class="step-instructions">${esc(step.instructions)}</div>
    ${fields.length ? `<div class="section-label">Data Collection</div>${renderDataTable(fields)}` : ''}
    ${step.checkpoint ? `<div class="checkpoint"><strong>Checkpoint:</strong> ${esc(step.checkpoint)}</div>` : ''}
    ${step.reflection_prompt ? `<div class="section-label">Reflection</div>
      <p class="reflection-prompt">${esc(step.reflection_prompt)}</p>
      <div class="answer-lines">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>` : ''}
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
  preLabQuestions: PreLabQuestion[]
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
        ${preLabQuestions.map((q, i) => renderPreLabQuestion(q, i)).join('')}
      </section>`
    : ''

  const procedureHtml = steps.length
    ? `<section class="procedure">
        <h2>Procedure</h2>
        ${steps.map((s, i) => renderStep(s, i)).join('')}
      </section>`
    : ''

  const nameDate = `<div class="name-date">
    <div class="field-row"><span>Name:</span><span class="field-line"></span></div>
    <div class="field-row"><span>Date:</span><span class="field-line short"></span><span>Period:</span><span class="field-line short"></span></div>
  </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(lab.title)} — Student Handout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 11pt; color: #111; background: #fff; }
    .page { max-width: 750px; margin: 0 auto; padding: 28px 32px; }

    /* Print button — hidden when printing */
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

    /* Header */
    .lab-header { margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 12px; }
    .lab-title { font-size: 20pt; font-weight: bold; margin-bottom: 4px; }
    .lab-meta { font-size: 9pt; color: #555; display: flex; gap: 16px; flex-wrap: wrap; }

    .name-date { margin: 16px 0 20px; display: flex; flex-direction: column; gap: 8px; font-size: 10pt; }
    .field-row { display: flex; align-items: center; gap: 8px; }
    .field-line { border-bottom: 1px solid #888; flex: 1; height: 20px; }
    .field-line.short { flex: 0 0 90px; }

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
    .bubble { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #555; border-radius: 50%; flex-shrink: 0; }
    .answer-lines { margin-top: 6px; }
    .line { border-bottom: 1px solid #aaa; margin-bottom: 14px; }

    /* Steps */
    .step { margin-bottom: 24px; page-break-inside: avoid; }
    .step-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
    .step-number { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
    .step-title { font-size: 11.5pt; font-weight: bold; }
    .step-instructions { line-height: 1.65; margin-bottom: 10px; }
    .section-label { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em; color: #555; margin-bottom: 5px; margin-top: 10px; }
    .checkpoint { border-left: 3px solid #2563eb; padding: 7px 12px; background: #eff6ff; font-size: 10pt; margin: 10px 0; border-radius: 0 4px 4px 0; }
    .reflection-prompt { font-style: italic; color: #444; margin-bottom: 4px; font-size: 10.5pt; }

    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
    .data-table th { background: #f3f4f6; border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 9.5pt; }
    .data-table td { border: 1px solid #ccc; padding: 10px; }

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

    ${nameDate}

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
