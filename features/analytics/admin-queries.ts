import { createClient } from '@/lib/supabase/server'

export type OrgOverview = {
  total_students: number
  total_teachers: number
  total_published_labs: number
  active_runs_last_7_days: number
  overall_completion_rate: number
  help_request_rate: number
}

export type TeacherUsageStat = {
  teacher_id: string
  teacher_name: string
  labs_created: number
  classes_taught: number
  total_students: number
  submissions_graded: number
  help_escalations_received: number
}

export type StudentUsageStat = {
  student_id: string
  student_name: string
  labs_attempted: number
  labs_completed: number
  avg_grade_pct: number | null
  help_requests_sent: number
}

export type CompletionTrendPoint = {
  week_start: string
  completed_count: number
}

export type OrgHelpStats = {
  total_requests: number
  escalated_count: number
  escalation_rate: number
  avg_conversation_turns: number
}

export async function getOrgAnalyticsOverview(orgId: string): Promise<OrgOverview> {
  const supabase = await createClient()

  // Fetch counts and lab IDs in parallel
  const [
    { data: students },
    { data: teachers },
    { data: allLabIds },
  ] = await Promise.all([
    supabase.from('profiles').select('id').eq('organization_id', orgId).eq('role', 'student'),
    supabase.from('profiles').select('id').eq('organization_id', orgId).eq('role', 'teacher'),
    supabase.from('labs').select('id').eq('organization_id', orgId),
  ])

  const labIds = (allLabIds ?? []).map((l: any) => l.id)
  const publishedLabCount = (allLabIds ?? []).length // approximate; filter below
  const { data: publishedLabs } = await supabase
    .from('labs').select('id').eq('organization_id', orgId).eq('status', 'published')

  if (labIds.length === 0) {
    return {
      total_students: (students ?? []).length,
      total_teachers: (teachers ?? []).length,
      total_published_labs: (publishedLabs ?? []).length,
      active_runs_last_7_days: 0,
      overall_completion_rate: 0,
      help_request_rate: 0,
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: recentRuns },
    { data: allRuns },
  ] = await Promise.all([
    supabase.from('student_lab_runs').select('id')
      .in('lab_id', labIds)
      .gte('updated_at', sevenDaysAgo),
    supabase.from('student_lab_runs').select('id, completed_at')
      .in('lab_id', labIds),
  ])

  const runIds = (allRuns ?? []).map((r: any) => r.id)
  const { data: helpReqs } = runIds.length > 0
    ? await supabase.from('help_requests').select('id').in('lab_run_id', runIds)
    : { data: [] }

  const totalRuns = (allRuns ?? []).length
  const completedRuns = (allRuns ?? []).filter((r: any) => r.completed_at).length
  const completionRate = totalRuns > 0 ? completedRuns / totalRuns : 0
  const helpRate = totalRuns > 0 ? (helpReqs ?? []).length / totalRuns : 0

  return {
    total_students: (students ?? []).length,
    total_teachers: (teachers ?? []).length,
    total_published_labs: (publishedLabs ?? []).length,
    active_runs_last_7_days: (recentRuns ?? []).length,
    overall_completion_rate: Math.round(completionRate * 100),
    help_request_rate: Math.round(helpRate * 100),
  }
}

export async function getTeacherUsageStats(orgId: string): Promise<TeacherUsageStat[]> {
  const supabase = await createClient()
  const db = supabase as any

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('organization_id', orgId)
    .eq('role', 'teacher')
    .order('last_name', { ascending: true })

  if (!teachers || teachers.length === 0) return []

  const stats = await Promise.all(
    teachers.map(async (t) => {
      const [
        { data: labsCreated },
        { data: classesRaw },
        { data: gradesRaw },
      ] = await Promise.all([
        db.from('labs').select('id', { count: 'exact', head: false }).eq('teacher_id', t.id),
        db.from('class_teachers').select('class_id').eq('teacher_id', t.id),
        db.from('student_grades').select('id').eq('teacher_id', t.id),
      ])

      const classIds = (classesRaw ?? []).map((c: any) => c.class_id)
      let totalStudents = 0
      let helpEscalations = 0

      if (classIds.length > 0) {
        const { data: enrollments } = await db
          .from('class_enrollments')
          .select('student_id')
          .in('class_id', classIds)
        const uniqueStudents = new Set((enrollments ?? []).map((e: any) => e.student_id))
        totalStudents = uniqueStudents.size

        const { data: assignments } = await db
          .from('lab_assignments')
          .select('id')
          .in('class_id', classIds)
        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map((a: any) => a.id)
          const { data: runs } = await db
            .from('student_lab_runs')
            .select('id')
            .in('assignment_id', assignmentIds)
          if (runs && runs.length > 0) {
            const runIds = runs.map((r: any) => r.id)
            const { data: escalated } = await db
              .from('help_requests')
              .select('id')
              .in('lab_run_id', runIds)
              .eq('escalated_to_teacher', true)
            helpEscalations = (escalated ?? []).length
          }
        }
      }

      return {
        teacher_id: t.id,
        teacher_name: `${t.first_name} ${t.last_name}`,
        labs_created: (labsCreated ?? []).length,
        classes_taught: classIds.length,
        total_students: totalStudents,
        submissions_graded: (gradesRaw ?? []).length,
        help_escalations_received: helpEscalations,
      } satisfies TeacherUsageStat
    })
  )

  return stats.sort((a, b) => b.labs_created - a.labs_created)
}

export async function getStudentUsageStats(orgId: string): Promise<StudentUsageStat[]> {
  const supabase = await createClient()
  const db = supabase as any

  const { data: students } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('organization_id', orgId)
    .eq('role', 'student')
    .order('last_name', { ascending: true })

  if (!students || students.length === 0) return []

  const stats = await Promise.all(
    students.map(async (s) => {
      const { data: runs } = await supabase
        .from('student_lab_runs').select('id, completed_at').eq('student_id', s.id)
      const runIds = (runs ?? []).map((r: any) => r.id)
      const [{ data: grades }, { data: helpReqs }] = await Promise.all([
        runIds.length > 0
          ? db.from('student_grades').select('total_score, max_score').in('lab_run_id', runIds)
          : Promise.resolve({ data: [] }),
        supabase.from('help_requests').select('id').eq('student_id', s.id),
      ])

      const attempted = (runs ?? []).length
      const completed = (runs ?? []).filter((r: any) => r.completed_at).length
      const gradeList = (grades ?? []).filter((g: any) => g.max_score > 0)
      const avgGrade = gradeList.length > 0
        ? Math.round(
          gradeList.reduce((sum: number, g: any) => sum + g.total_score / g.max_score, 0)
          / gradeList.length * 100
        )
        : null

      return {
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        labs_attempted: attempted,
        labs_completed: completed,
        avg_grade_pct: avgGrade,
        help_requests_sent: (helpReqs ?? []).length,
      } satisfies StudentUsageStat
    })
  )

  return stats.sort((a, b) => b.labs_completed - a.labs_completed)
}

export async function getOrgCompletionTrend(orgId: string): Promise<CompletionTrendPoint[]> {
  const supabase = await createClient()
  const db = supabase as any

  const weeksAgo8 = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)

  const { data: labIds } = await db
    .from('labs')
    .select('id')
    .eq('organization_id', orgId)

  if (!labIds || labIds.length === 0) return []

  const { data: runs } = await db
    .from('student_lab_runs')
    .select('completed_at')
    .in('lab_id', labIds.map((l: any) => l.id))
    .gte('completed_at', weeksAgo8.toISOString())
    .not('completed_at', 'is', null)

  const weekMap = new Map<string, number>()
  for (const run of runs ?? []) {
    const d = new Date(run.completed_at)
    const dayOfWeek = d.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const key = monday.toISOString().split('T')[0]
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  }

  // Build last 8 weeks sorted
  const result: CompletionTrendPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    const dayOfWeek = d.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7
    d.setDate(d.getDate() - mondayOffset - i * 7)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().split('T')[0]
    result.push({ week_start: key, completed_count: weekMap.get(key) ?? 0 })
  }
  return result
}

export async function getOrgHelpStats(orgId: string): Promise<OrgHelpStats> {
  const supabase = await createClient()
  const db = supabase as any

  const { data: labIds } = await db
    .from('labs')
    .select('id')
    .eq('organization_id', orgId)

  if (!labIds || labIds.length === 0) {
    return { total_requests: 0, escalated_count: 0, escalation_rate: 0, avg_conversation_turns: 0 }
  }

  const { data: runIds } = await db
    .from('student_lab_runs')
    .select('id')
    .in('lab_id', labIds.map((l: any) => l.id))

  if (!runIds || runIds.length === 0) {
    return { total_requests: 0, escalated_count: 0, escalation_rate: 0, avg_conversation_turns: 0 }
  }

  const { data: requests } = await db
    .from('help_requests')
    .select('id, escalated_to_teacher, conversation')
    .in('lab_run_id', runIds.map((r: any) => r.id))

  const total = (requests ?? []).length
  const escalated = (requests ?? []).filter((r: any) => r.escalated_to_teacher).length
  const totalTurns = (requests ?? []).reduce((sum: number, r: any) => {
    const conv = Array.isArray(r.conversation) ? r.conversation : []
    return sum + conv.length
  }, 0)

  return {
    total_requests: total,
    escalated_count: escalated,
    escalation_rate: total > 0 ? Math.round(escalated / total * 100) : 0,
    avg_conversation_turns: total > 0 ? Math.round(totalTurns / total) : 0,
  }
}
