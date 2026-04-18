import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const actor = await getProfile()
  if (!actor || !['school_admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const studentId = request.nextUrl.searchParams.get('studentId')
  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const db = supabase as any

  // Verify student belongs to same org
  const { data: profile } = await db
    .from('profiles')
    .select('id, first_name, last_name, role, organization_id')
    .eq('id', studentId)
    .single()

  if (!profile || profile.organization_id !== actor.organization_id) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const [labRuns, stepResponses, preLabResponses, helpRequests] = await Promise.all([
    db.from('student_lab_runs').select('*').eq('student_id', studentId),
    db.from('step_responses').select('*').eq('student_id', studentId),
    db.from('pre_lab_responses').select('*').eq('student_id', studentId),
    db.from('help_requests').select('*').eq('student_id', studentId),
  ])

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'export_student_data',
    targetTable: 'profiles',
    targetId: studentId,
  })

  const exportData = {
    exported_at: new Date().toISOString(),
    exported_by: `${actor.first_name} ${actor.last_name}`,
    student: {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
    },
    lab_runs: labRuns.data ?? [],
    step_responses: stepResponses.data ?? [],
    pre_lab_responses: preLabResponses.data ?? [],
    help_requests: helpRequests.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="student-data-${studentId}.json"`,
    },
  })
}
