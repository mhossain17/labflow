import { ClassSection } from './ClassSection'

interface StudentDashboardProps {
  firstName: string
  classes: any[]
  studentId: string
}

export function StudentDashboard({ firstName, classes, studentId }: StudentDashboardProps) {
  const allAssignments = classes.flatMap((c) => c.lab_assignments)
  const inProgress = allAssignments.filter((a) => a.lab_run && !a.lab_run.completed_at).length
  const complete = allAssignments.filter((a) => a.lab_run?.completed_at).length

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span>
          <span>·</span>
          <span>{inProgress} in progress</span>
          <span>·</span>
          <span>{complete} complete</span>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-2">
          <p className="text-muted-foreground">You are not enrolled in any classes yet.</p>
          <p className="text-sm text-muted-foreground">Ask your teacher for an enrollment code.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {classes.map((cls) => (
            <ClassSection key={cls.id} cls={cls} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  )
}
