# Implementation Instructions: Student Dashboard + Rubric & Grading

This document is a self-contained implementation brief. Read it fully before writing any code.
Implement every item described. Do not ask clarifying questions — all decisions have been made.

---

## Project Context

**LabFlow** — Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase.
Working directory: `/Users/msh/LabFlow - Classroom Lab Manager`

Key patterns used throughout the codebase:
- `'use server'` at top of actions files; mutations call `revalidatePath` after DB writes
- Queries use `createClient` from `@/lib/supabase/server`; cast to `any` to bypass strict types
- Server components fetch data directly; client components marked `'use client'`
- `Button` from shadcn uses `render={<Link href="..." />}` prop for link-buttons
- `params` and `searchParams` in page components are `Promise<{...}>` — must be awaited
- Auth: `getProfile()` from `@/lib/auth/session`; redirect to `/login` if null

---

## Feature 1 — Student Dashboard

### Problem
`app/student/page.tsx` currently just redirects to `/student/labs` (a flat list).
Students can't see unstarted assignments (bug: only existing `student_lab_runs` are shown),
have no class-grouped view, and get no summary stats.

### Step 1 — Add query `getStudentDashboardData` to `features/lab-runner/queries.ts`

Append this function to the existing file (do not remove existing functions):

```typescript
export async function getStudentDashboardData(studentId: string) {
  const client = await createClient()
  const db = client as any

  // Query 1: enrolled classes → assignments → labs → teacher name
  const { data: enrollments } = await db
    .from('class_enrollments')
    .select(`
      class_id,
      classes(
        id, name, period, school_year, archived,
        profiles:teacher_id(first_name, last_name),
        lab_assignments(
          id, due_date, lab_id,
          labs(id, title, overview, estimated_minutes, status)
        )
      )
    `)
    .eq('student_id', studentId)

  // Query 2: all existing lab runs for this student
  const { data: runs } = await db
    .from('student_lab_runs')
    .select('id, assignment_id, current_step, prelab_completed, status, completed_at, lab_id, labs(title, lab_steps(id))')
    .eq('student_id', studentId)

  const runsByAssignment = new Map<string, typeof runs[0]>()
  for (const run of (runs ?? [])) {
    if (run.assignment_id) runsByAssignment.set(run.assignment_id, run)
  }

  // Merge: annotate each assignment with its run (or null)
  const classes = (enrollments ?? [])
    .map((e: any) => e.classes)
    .filter(Boolean)
    .filter((c: any) => !c.archived)
    .map((cls: any) => ({
      ...cls,
      lab_assignments: (cls.lab_assignments ?? [])
        .filter((a: any) => a.labs?.status === 'published')
        .map((a: any) => ({
          ...a,
          lab_run: runsByAssignment.get(a.id) ?? null,
        })),
    }))

  return classes
}
```

Also append this function for grade display on the complete page:

```typescript
export async function getGradeForRun(labRunId: string) {
  const client = await createClient()
  const db = client as any

  const [{ data: grade }, { data: scores }] = await Promise.all([
    db.from('student_grades').select('*').eq('lab_run_id', labRunId).maybeSingle(),
    db.from('rubric_scores')
      .select('*, rubric_items(id, title, description, max_points, position)')
      .eq('lab_run_id', labRunId),
  ])

  return { grade: grade ?? null, scores: scores ?? [] }
}
```

### Step 2 — Add action `startLabRun` to `features/lab-runner/actions.ts`

Append to the existing file (uses the existing `createLabRun` function already in the file):

```typescript
export async function startLabRun(assignmentId: string, labId: string, studentId: string) {
  const run = await createLabRun(assignmentId, studentId, labId)
  revalidatePath('/student')
  return run.id
}
```

### Step 3 — Create `components/student/AssignmentCard.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { startLabRun } from '@/features/lab-runner/actions'
import { CheckCircle2, Clock, Loader2, Play, ArrowRight, BookOpen } from 'lucide-react'

interface AssignmentCardProps {
  assignment: {
    id: string
    due_date: string | null
    lab_id: string
    labs: { id: string; title: string; overview: string | null; estimated_minutes: number | null }
    lab_run: {
      id: string
      current_step: number
      prelab_completed: boolean
      status: string
      completed_at: string | null
      labs: { title: string; lab_steps: { id: string }[] } | null
    } | null
  }
  studentId: string
}

export function AssignmentCard({ assignment, studentId }: AssignmentCardProps) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const run = assignment.lab_run
  const lab = assignment.labs

  const totalSteps = run?.labs?.lab_steps?.length ?? 0
  const progress = totalSteps > 0
    ? Math.round(((run?.current_step ?? 0) / totalSteps) * 100)
    : 0

  const dueDate = assignment.due_date
    ? new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  async function handleStart() {
    setStarting(true)
    try {
      const labRunId = await startLabRun(assignment.id, assignment.lab_id, studentId)
      router.push(`/student/labs/${labRunId}/overview`)
    } catch {
      setStarting(false)
    }
  }

  const isComplete = !!run?.completed_at
  const isInProgress = run && !isComplete

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{lab.title}</h3>
          {lab.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{lab.overview}</p>
          )}
        </div>
        {isComplete ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="size-3" />
            Complete
          </span>
        ) : isInProgress ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            In Progress
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Not Started
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {lab.estimated_minutes && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {lab.estimated_minutes} min
          </span>
        )}
        {dueDate && (
          <span>Due {dueDate}</span>
        )}
      </div>

      {isInProgress && totalSteps > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {run.current_step} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {isComplete ? (
          <Button size="sm" variant="outline" render={<Link href={`/student/labs/${run!.id}/complete`} />}>
            <BookOpen className="size-3.5" />
            View
          </Button>
        ) : isInProgress ? (
          <Button size="sm" render={<Link href={`/student/labs/${run!.id}/overview`} />}>
            Continue
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} disabled={starting}>
            {starting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Start Lab
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Step 4 — Create `components/student/ClassSection.tsx`

```typescript
import { AssignmentCard } from './AssignmentCard'
import { BookOpen } from 'lucide-react'

interface ClassSectionProps {
  cls: {
    id: string
    name: string
    period: string | null
    school_year: string | null
    profiles: { first_name: string; last_name: string } | null
    lab_assignments: any[]
  }
  studentId: string
}

export function ClassSection({ cls, studentId }: ClassSectionProps) {
  const teacher = cls.profiles
    ? `${cls.profiles.first_name} ${cls.profiles.last_name}`
    : null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-base">
            {cls.name}
            {cls.period && <span className="text-muted-foreground font-normal text-sm ml-1.5">· {cls.period}</span>}
          </h2>
          {teacher && (
            <p className="text-xs text-muted-foreground">{teacher}</p>
          )}
        </div>
      </div>

      {cls.lab_assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-6">No assignments yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 pl-6">
          {cls.lab_assignments.map((a: any) => (
            <AssignmentCard key={a.id} assignment={a} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  )
}
```

### Step 5 — Create `components/student/StudentDashboard.tsx`

```typescript
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
```

### Step 6 — Replace `app/student/page.tsx`

```typescript
import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getStudentDashboardData } from '@/features/lab-runner/queries'
import { StudentDashboard } from '@/components/student/StudentDashboard'

export default async function StudentPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const classes = await getStudentDashboardData(profile.id)

  return (
    <StudentDashboard
      firstName={profile.first_name ?? 'Student'}
      classes={classes}
      studentId={profile.id}
    />
  )
}
```

---

## Feature 2 — Rubric & Grading System

### Step 7 — Create migration `supabase/migrations/008_rubrics_grading.sql`

```sql
-- Rubric criteria authored by teachers per lab
CREATE TABLE public.rubric_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id      uuid        NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  max_points  integer     NOT NULL DEFAULT 10,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.rubric_items (lab_id);

-- Overall grade record for a submitted lab run
CREATE TABLE public.student_grades (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id      uuid        UNIQUE NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  teacher_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_score     numeric,
  max_score       numeric,
  letter_grade    text,
  overall_comment text,
  graded_at       timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Per-criterion scores (self-assessment and teacher scores)
CREATE TABLE public.rubric_scores (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_run_id      uuid        NOT NULL REFERENCES public.student_lab_runs(id) ON DELETE CASCADE,
  rubric_item_id  uuid        NOT NULL REFERENCES public.rubric_items(id) ON DELETE CASCADE,
  self_score      numeric,
  teacher_score   numeric,
  teacher_comment text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_run_id, rubric_item_id)
);

-- RLS
ALTER TABLE public.rubric_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;

-- rubric_items: teachers manage their own labs' rubrics; students read published labs in their classes
CREATE POLICY "teachers_manage_rubric_items" ON public.rubric_items
  FOR ALL USING (
    lab_id IN (SELECT id FROM public.labs WHERE teacher_id = auth.uid())
  );

CREATE POLICY "students_read_rubric_items" ON public.rubric_items
  FOR SELECT USING (
    lab_id IN (
      SELECT la.lab_id FROM public.lab_assignments la
      JOIN public.class_enrollments ce ON ce.class_id = la.class_id
      WHERE ce.student_id = auth.uid()
    )
  );

-- student_grades: teachers write for their students; students read own records
CREATE POLICY "teachers_manage_grades" ON public.student_grades
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "students_read_own_grades" ON public.student_grades
  FOR SELECT USING (
    lab_run_id IN (
      SELECT id FROM public.student_lab_runs WHERE student_id = auth.uid()
    )
  );

-- rubric_scores: teachers write teacher_score/comment; students write self_score; both read own rows
CREATE POLICY "teachers_manage_rubric_scores" ON public.rubric_scores
  FOR ALL USING (
    lab_run_id IN (
      SELECT slr.id FROM public.student_lab_runs slr
      JOIN public.lab_assignments la ON la.id = slr.assignment_id
      JOIN public.classes c ON c.id = la.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "students_manage_own_rubric_scores" ON public.rubric_scores
  FOR ALL USING (
    lab_run_id IN (
      SELECT id FROM public.student_lab_runs WHERE student_id = auth.uid()
    )
  );
```

Run this migration: `supabase db push`

### Step 8 — Add `getRubricItems` to `features/lab-builder/queries.ts`

Append to the existing file:

```typescript
export async function getRubricItems(labId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db
    .from('rubric_items')
    .select('*')
    .eq('lab_id', labId)
    .order('position', { ascending: true })
  return (data ?? []) as Array<{
    id: string
    lab_id: string
    title: string
    description: string | null
    max_points: number
    position: number
    created_at: string
  }>
}
```

### Step 9 — Add `saveRubricItems` to `features/lab-builder/actions.ts`

Append to the existing file:

```typescript
export async function saveRubricItems(
  labId: string,
  items: Array<{ title: string; description?: string; max_points: number; position: number }>
) {
  const supabase = await createClient()
  const db = supabase as any
  // Delete all existing items for this lab, then re-insert
  const { error: delError } = await db.from('rubric_items').delete().eq('lab_id', labId)
  if (delError) throw delError
  if (items.length > 0) {
    const { error: insError } = await db.from('rubric_items').insert(
      items.map((item, i) => ({
        lab_id: labId,
        title: item.title,
        description: item.description ?? null,
        max_points: item.max_points,
        position: i,
      }))
    )
    if (insError) throw insError
  }
  revalidatePath(`/teacher/labs/${labId}/edit`)
}
```

### Step 10 — Create `components/teacher/lab-builder/RubricEditor.tsx`

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveRubricItems } from '@/features/lab-builder/actions'
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react'

interface RubricItem {
  id?: string
  title: string
  description: string
  max_points: number
}

interface RubricEditorProps {
  labId: string
  initialItems: RubricItem[]
}

export function RubricEditor({ labId, initialItems }: RubricEditorProps) {
  const [items, setItems] = useState<RubricItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ title: '', description: '', max_points: 10 }]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalPoints = items.reduce((sum, item) => sum + (item.max_points || 0), 0)

  function addItem() {
    setItems((prev) => [...prev, { title: '', description: '', max_points: 10 }])
    setSaved(false)
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  function updateItem(index: number, field: keyof RubricItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveRubricItems(
        labId,
        items
          .filter((item) => item.title.trim())
          .map((item, i) => ({
            title: item.title.trim(),
            description: item.description.trim() || undefined,
            max_points: item.max_points || 0,
            position: i,
          }))
      )
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define the criteria students will be graded on. Students can self-assess; teachers assign final scores.
      </p>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Criterion {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                disabled={saving}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1">
                <Label htmlFor={`title-${index}`} className="text-xs">Criterion Title</Label>
                <Input
                  id={`title-${index}`}
                  placeholder="e.g. Hypothesis Quality"
                  value={item.title}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1 w-24">
                <Label htmlFor={`pts-${index}`} className="text-xs">Max Points</Label>
                <Input
                  id={`pts-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={item.max_points}
                  onChange={(e) => updateItem(index, 'max_points', parseInt(e.target.value) || 0)}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`desc-${index}`} className="text-xs">Description (optional)</Label>
              <Textarea
                id={`desc-${index}`}
                rows={2}
                placeholder="Describe what earns full points for this criterion…"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                disabled={saving}
                className="resize-none text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem} disabled={saving} className="w-full gap-2">
        <Plus className="size-4" />
        Add Criterion
      </Button>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Total: <strong>{totalPoints} points</strong>
        </p>
        <Button onClick={handleSave} disabled={saving || saved} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saved ? 'Saved!' : 'Save Rubric'}
        </Button>
      </div>
    </div>
  )
}
```

### Step 11 — Modify `components/teacher/lab-builder/LabBuilderForm.tsx`

**Read the file first.** Then make these targeted changes:

1. **Add import** at top of imports block:
   ```typescript
   import { ClipboardCheck } from 'lucide-react'
   import { RubricEditor } from './RubricEditor'
   import { getRubricItems } from '@/features/lab-builder/queries'
   ```

2. **In `WIZARD_STEPS` array**, insert step 6 (Rubric) and change the existing step 6 (Review & Publish) to step 7:
   ```typescript
   { num: 6, label: 'Rubric', icon: ClipboardCheck },
   { num: 7, label: 'Review & Publish', icon: Rocket },
   ```
   (Remove the old `{ num: 6, label: 'Review & Publish', icon: Rocket }`)

3. **In the step-rendering switch/conditional**, add a case for step 6 that renders `<RubricEditor>`:
   Find the block that renders content based on `currentStep`. Add (before the Review & Publish case which becomes step 7):
   ```typescript
   // Step 6 — Rubric
   // Fetch rubric items server-side and pass; since LabBuilderForm is a client component,
   // pass initialRubricItems as a prop from the parent server component.
   ```
   
   **Important**: Because `LabBuilderForm` is a client component, `getRubricItems` must be called in the **server component** `app/teacher/labs/[labId]/edit/page.tsx` and passed as a prop.

4. **Add `initialRubricItems` prop** to `LabBuilderForm` interface:
   ```typescript
   interface LabBuilderFormProps {
     lab: Lab & { lab_steps: LabStep[]; pre_lab_questions: PreLabQuestion[] }
     initialStep?: number
     initialRubricItems: Array<{ id?: string; title: string; description: string | null; max_points: number; position: number }>
   }
   ```

5. **In the step renderer**, for `currentStep === 6`:
   ```typescript
   {currentStep === 6 && (
     <div className="space-y-2">
       <h2 className="text-lg font-semibold">Rubric</h2>
       <RubricEditor labId={lab.id} initialItems={props.initialRubricItems.map(i => ({
         id: i.id,
         title: i.title,
         description: i.description ?? '',
         max_points: i.max_points,
       }))} />
     </div>
   )}
   ```

6. **For step 7** (was step 6 — Review & Publish), update its render condition from `currentStep === 6` to `currentStep === 7`. Also update any "Save & Continue" logic so step 6 advances to step 7 and step 7 is the final step.

7. **Update `initialStep` clamping** in `app/teacher/labs/[labId]/edit/page.tsx` from `Math.min(6, ...)` to `Math.min(7, ...)`.

### Step 12 — Modify `app/teacher/labs/[labId]/edit/page.tsx`

Replace the file content with:

```typescript
import { getLabWithSteps } from '@/features/teacher/queries'
import { getRubricItems } from '@/features/lab-builder/queries'
import { LabBuilderForm } from '@/components/teacher/lab-builder/LabBuilderForm'
import { notFound } from 'next/navigation'

interface EditLabPageProps {
  params: Promise<{ labId: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function EditLabPage({ params, searchParams }: EditLabPageProps) {
  const [{ labId }, { step }] = await Promise.all([params, searchParams])
  const initialStep = Math.max(1, Math.min(7, parseInt(step ?? '1', 10) || 1))
  const [lab, rubricItems] = await Promise.all([
    getLabWithSteps(labId),
    getRubricItems(labId),
  ])
  if (!lab) notFound()

  return <LabBuilderForm lab={lab} initialStep={initialStep} initialRubricItems={rubricItems} />
}
```

### Step 13 — Modify `app/teacher/labs/[labId]/page.tsx`

**Read the file first.** Add a "Grade Submissions" button in the action buttons area (near the Edit and Monitor buttons). It should only appear when `lab.status === 'published'`. Import `GraduationCap` from lucide-react.

Add this button alongside the existing Monitor button:
```typescript
{lab.status === 'published' && (
  <Button variant="outline" size="sm" render={<Link href={`/teacher/labs/${labId}/grade`} />}>
    <GraduationCap className="size-4" />
    Grade Submissions
  </Button>
)}
```

### Step 14 — Add grading queries to `features/teacher/queries.ts`

Append to the existing file:

```typescript
export async function getSubmissionsForGrading(labId: string) {
  const supabase = await createClient()
  const db = supabase as any

  // Get all assignments for this lab, then get submitted runs grouped by class
  const { data: assignments } = await db
    .from('lab_assignments')
    .select(`
      id, class_id,
      classes(id, name, period),
      student_lab_runs(
        id, student_id, completed_at, status, started_at,
        profiles:student_id(id, first_name, last_name),
        student_grades(id, total_score, max_score, letter_grade, graded_at)
      )
    `)
    .eq('lab_id', labId)

  return (assignments ?? []).map((a: any) => ({
    ...a,
    student_lab_runs: (a.student_lab_runs ?? []).filter((r: any) => !!r.completed_at),
  }))
}

export async function getGradingSheetData(labRunId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const [{ data: run }, { data: rubricScores }] = await Promise.all([
    db.from('student_lab_runs')
      .select(`
        id, student_id, lab_id, completed_at,
        profiles:student_id(id, first_name, last_name),
        labs(id, title, lab_steps(*), pre_lab_questions(*)),
        pre_lab_responses(*),
        step_responses(*),
        student_grades(*)
      `)
      .eq('id', labRunId)
      .single(),
    db.from('rubric_scores')
      .select('*, rubric_items(*)')
      .eq('lab_run_id', labRunId),
  ])

  if (!run) return null

  // Fetch rubric items for the lab
  const { data: rubricItems } = await db
    .from('rubric_items')
    .select('*')
    .eq('lab_id', run.lab_id)
    .order('position', { ascending: true })

  return {
    run,
    rubricItems: rubricItems ?? [],
    rubricScores: rubricScores ?? [],
    existingGrade: run.student_grades?.[0] ?? null,
  }
}
```

### Step 15 — Add `saveStudentGrade` to `features/teacher/actions.ts`

Read `features/teacher/actions.ts` first, then append:

```typescript
export async function saveStudentGrade(
  labRunId: string,
  teacherId: string,
  rubricScores: Array<{ rubricItemId: string; teacherScore: number; teacherComment?: string }>,
  overall: { letterGrade?: string; overallComment?: string; totalScore: number; maxScore: number }
) {
  const supabase = await createClient()
  const db = supabase as any

  // Upsert per-criterion scores
  if (rubricScores.length > 0) {
    await Promise.all(
      rubricScores.map((s) =>
        db.from('rubric_scores').upsert(
          {
            lab_run_id: labRunId,
            rubric_item_id: s.rubricItemId,
            teacher_score: s.teacherScore,
            teacher_comment: s.teacherComment ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'lab_run_id,rubric_item_id' }
        )
      )
    )
  }

  // Upsert overall grade
  const { error } = await db.from('student_grades').upsert(
    {
      lab_run_id: labRunId,
      teacher_id: teacherId,
      total_score: overall.totalScore,
      max_score: overall.maxScore,
      letter_grade: overall.letterGrade ?? null,
      overall_comment: overall.overallComment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'lab_run_id' }
  )
  if (error) throw error

  revalidatePath(`/teacher/labs`)
}
```

### Step 16 — Create `app/teacher/labs/[labId]/grade/page.tsx`

```typescript
import { getProfile } from '@/lib/auth/session'
import { getLabWithSteps } from '@/features/teacher/queries'
import { getSubmissionsForGrading } from '@/features/teacher/queries'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ labId: string }>
}

export default async function GradeSubmissionsPage({ params }: Props) {
  const { labId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [lab, assignments] = await Promise.all([
    getLabWithSteps(labId),
    getSubmissionsForGrading(labId),
  ])
  if (!lab) notFound()

  const totalSubmissions = assignments.reduce(
    (sum: number, a: any) => sum + a.student_lab_runs.length, 0
  )

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <Link
        href={`/teacher/labs/${labId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to lab
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Grade Submissions</h1>
        <p className="text-muted-foreground mt-1">{lab.title} · {totalSubmissions} submitted</p>
      </div>

      {totalSubmissions === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment: any) => {
            if (assignment.student_lab_runs.length === 0) return null
            return (
              <section key={assignment.id} className="space-y-3">
                <h2 className="font-semibold">
                  {assignment.classes?.name}
                  {assignment.classes?.period && (
                    <span className="text-muted-foreground font-normal ml-1.5">({assignment.classes.period})</span>
                  )}
                </h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignment.student_lab_runs.map((run: any, idx: number) => {
                        const grade = run.student_grades?.[0]
                        const studentName = run.profiles
                          ? `${run.profiles.first_name} ${run.profiles.last_name}`
                          : 'Unknown'
                        return (
                          <tr
                            key={run.id}
                            className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                          >
                            <td className="px-4 py-3 font-medium">{studentName}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {new Date(run.completed_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {grade ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                  <CheckCircle2 className="size-3.5" />
                                  {grade.total_score}/{grade.max_score} pts
                                  {grade.letter_grade && ` · ${grade.letter_grade}`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Ungraded</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant={grade ? 'outline' : 'default'}
                                render={<Link href={`/teacher/labs/${labId}/grade/${run.id}`} />}
                              >
                                {grade ? 'Edit Grade' : 'Grade'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### Step 17 — Create `components/teacher/grading/GradingSheet.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveStudentGrade } from '@/features/teacher/actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface RubricItem {
  id: string
  title: string
  description: string | null
  max_points: number
}

interface RubricScore {
  rubric_item_id: string
  teacher_score: number | null
  teacher_comment: string | null
  self_score: number | null
}

interface GradingSheetProps {
  labRunId: string
  teacherId: string
  labId: string
  studentName: string
  rubricItems: RubricItem[]
  existingScores: RubricScore[]
  existingGrade: {
    total_score: number | null
    max_score: number | null
    letter_grade: string | null
    overall_comment: string | null
  } | null
}

export function GradingSheet({
  labRunId,
  teacherId,
  labId,
  studentName,
  rubricItems,
  existingScores,
  existingGrade,
}: GradingSheetProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, { score: string; comment: string }>>(() => {
    const initial: Record<string, { score: string; comment: string }> = {}
    for (const item of rubricItems) {
      const existing = existingScores.find((s) => s.rubric_item_id === item.id)
      initial[item.id] = {
        score: existing?.teacher_score?.toString() ?? '',
        comment: existing?.teacher_comment ?? '',
      }
    }
    return initial
  })
  const [letterGrade, setLetterGrade] = useState(existingGrade?.letter_grade ?? '')
  const [overallComment, setOverallComment] = useState(existingGrade?.overall_comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const maxScore = rubricItems.reduce((sum, item) => sum + item.max_points, 0)
  const totalScore = Object.entries(scores).reduce((sum, [itemId, val]) => {
    const item = rubricItems.find((r) => r.id === itemId)
    if (!item) return sum
    return sum + Math.min(parseFloat(val.score) || 0, item.max_points)
  }, 0)

  async function handleSave() {
    setSaving(true)
    try {
      await saveStudentGrade(
        labRunId,
        teacherId,
        rubricItems.map((item) => ({
          rubricItemId: item.id,
          teacherScore: Math.min(parseFloat(scores[item.id]?.score) || 0, item.max_points),
          teacherComment: scores[item.id]?.comment || undefined,
        })),
        {
          letterGrade: letterGrade || undefined,
          overallComment: overallComment || undefined,
          totalScore,
          maxScore,
        }
      )
      setSaved(true)
      setTimeout(() => router.push(`/teacher/labs/${labId}/grade`), 1000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Grading submission for</p>
          <h2 className="text-lg font-semibold">{studentName}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Running total</p>
          <p className="text-2xl font-bold">{totalScore} / {maxScore}</p>
        </div>
      </div>

      {rubricItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
          No rubric criteria defined for this lab. Add criteria in the lab editor (Rubric step).
        </div>
      ) : (
        <div className="space-y-4">
          {rubricItems.map((item) => {
            const selfScore = existingScores.find((s) => s.rubric_item_id === item.id)?.self_score
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">Max: {item.max_points} pts</span>
                </div>

                {selfScore !== null && selfScore !== undefined && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                    Student self-assessed: {selfScore} / {item.max_points} pts
                  </p>
                )}

                <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                  <div className="space-y-1 w-24">
                    <Label htmlFor={`score-${item.id}`} className="text-xs">Score</Label>
                    <Input
                      id={`score-${item.id}`}
                      type="number"
                      min="0"
                      max={item.max_points}
                      value={scores[item.id]?.score ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], score: e.target.value },
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`comment-${item.id}`} className="text-xs">Comment (optional)</Label>
                    <Textarea
                      id={`comment-${item.id}`}
                      rows={2}
                      className="resize-none text-sm"
                      value={scores[item.id]?.comment ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], comment: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-medium">Overall Grade</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="letterGrade" className="text-xs">Letter Grade (optional)</Label>
            <Input
              id="letterGrade"
              placeholder="e.g. A, B+, 88%"
              value={letterGrade}
              onChange={(e) => setLetterGrade(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="overallComment" className="text-xs">Overall Comment (optional)</Label>
          <Textarea
            id="overallComment"
            rows={3}
            className="resize-none text-sm"
            placeholder="Overall feedback for the student…"
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || saved} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saved ? (
            <>
              <CheckCircle2 className="size-4" />
              Saved!
            </>
          ) : (
            'Save Grade'
          )}
        </Button>
      </div>
    </div>
  )
}
```

### Step 18 — Create `app/teacher/labs/[labId]/grade/[labRunId]/page.tsx`

```typescript
import { getProfile } from '@/lib/auth/session'
import { getGradingSheetData } from '@/features/teacher/queries'
import { GradingSheet } from '@/components/teacher/grading/GradingSheet'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Database } from 'lucide-react'
import { normalizeAndSortLabSteps } from '@/lib/labs/steps'

interface Props {
  params: Promise<{ labId: string; labRunId: string }>
}

export default async function GradeRunPage({ params }: Props) {
  const { labId, labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const data = await getGradingSheetData(labRunId)
  if (!data) notFound()

  const { run, rubricItems, rubricScores, existingGrade } = data
  const studentName = run.profiles
    ? `${run.profiles.first_name} ${run.profiles.last_name}`
    : 'Student'
  const steps = normalizeAndSortLabSteps(run.labs?.lab_steps)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Link
        href={`/teacher/labs/${labId}/grade`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to submissions
      </Link>

      <h1 className="text-2xl font-bold">Grading: {studentName}</h1>
      <p className="text-muted-foreground -mt-4">{run.labs?.title}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Student responses */}
        <div className="space-y-6">
          <h2 className="font-semibold text-base">Student Responses</h2>

          {/* Pre-lab answers */}
          {run.pre_lab_responses?.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pre-Lab</h3>
              {run.pre_lab_responses.map((resp: any) => {
                const question = run.labs?.pre_lab_questions?.find(
                  (q: any) => q.id === resp.question_id
                )
                return (
                  <div key={resp.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {question?.question_text ?? 'Question'}
                    </p>
                    <p className="text-sm">{resp.response_text || '—'}</p>
                  </div>
                )
              })}
            </section>
          )}

          {/* Step responses */}
          {steps.map((step) => {
            const resp = run.step_responses?.find((r: any) => r.step_id === step.id)
            if (!resp) return null
            return (
              <section key={step.id} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="size-3.5" />
                  Step {step.step_number}: {step.title}
                </h3>
                {resp.data_values && Object.keys(resp.data_values).length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    {Object.entries(resp.data_values).map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {resp.reflection_text && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="size-3" /> Reflection
                    </p>
                    <p className="text-sm">{resp.reflection_text}</p>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* Right: Grading form */}
        <div>
          <GradingSheet
            labRunId={labRunId}
            teacherId={profile.id}
            labId={labId}
            studentName={studentName}
            rubricItems={rubricItems}
            existingScores={rubricScores}
            existingGrade={existingGrade}
          />
        </div>
      </div>
    </div>
  )
}
```

### Step 19 — Modify `components/student/lab-runner/LabOverview.tsx`

**Read the file first.** Add an optional `rubricItems` prop and render a rubric table at the bottom. The existing component already takes `lab: Lab`. Add:

1. New prop type:
   ```typescript
   interface RubricItem {
     id: string
     title: string
     description: string | null
     max_points: number
   }
   interface LabOverviewProps {
     lab: Lab
     rubricItems?: RubricItem[]
   }
   ```

2. Add import: `import { ClipboardCheck } from 'lucide-react'`

3. At the bottom of the component JSX (after the `estimated_minutes` block), add:
   ```typescript
   {rubricItems && rubricItems.length > 0 && (
     <section className="space-y-3">
       <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
         <ClipboardCheck className="size-4" />
         Grading Rubric
       </h2>
       <div className="rounded-lg border border-border overflow-hidden">
         <table className="w-full text-sm">
           <thead>
             <tr className="border-b border-border bg-muted/50">
               <th className="px-3 py-2 text-left font-medium text-muted-foreground">Criterion</th>
               <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
               <th className="px-3 py-2 text-right font-medium text-muted-foreground">Points</th>
             </tr>
           </thead>
           <tbody>
             {rubricItems.map((item, idx) => (
               <tr key={item.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                 <td className="px-3 py-2 font-medium">{item.title}</td>
                 <td className="px-3 py-2 text-muted-foreground">{item.description ?? '—'}</td>
                 <td className="px-3 py-2 text-right">{item.max_points}</td>
               </tr>
             ))}
             <tr className="bg-muted/50 font-medium">
               <td className="px-3 py-2" colSpan={2}>Total</td>
               <td className="px-3 py-2 text-right">{rubricItems.reduce((s, i) => s + i.max_points, 0)}</td>
             </tr>
           </tbody>
         </table>
       </div>
     </section>
   )}
   ```

### Step 20 — Modify `app/student/labs/[labRunId]/overview/page.tsx`

**Read the file first.** Add `getRubricItems` call and pass to `LabOverview`:

1. Add import: `import { getRubricItems } from '@/features/lab-builder/queries'`
2. In the data fetching section, after getting `run`, fetch rubric items:
   ```typescript
   const rubricItems = await getRubricItems(lab.id)
   ```
3. Pass to `LabOverview`: `<LabOverview lab={lab} rubricItems={rubricItems} />`

### Step 21 — Add self-assessment to `app/student/labs/[labRunId]/complete/page.tsx`

**Read the file first.** This is a server component. After the main completion content on the completed branch, add a self-assessment and grade section.

Add these imports:
```typescript
import { getGradeForRun } from '@/features/lab-runner/queries'
import { getRubricItems } from '@/features/lab-builder/queries'
import { SelfAssessment } from '@/components/student/lab-runner/SelfAssessment'
```

In the data-fetching section, add:
```typescript
const labId = run.labs?.id ?? run.lab_id
const [rubricItems, { grade, scores }] = await Promise.all([
  getRubricItems(labId),
  getGradeForRun(labRunId),
])
```

In the `isCompleted` branch JSX, after the steps summary section, add:
```typescript
{rubricItems.length > 0 && (
  <SelfAssessment
    labRunId={labRunId}
    rubricItems={rubricItems}
    existingScores={scores}
    teacherGrade={grade}
  />
)}
```

### Step 22 — Add `saveSelfAssessment` to `features/lab-runner/actions.ts`

Append to the existing file:

```typescript
export async function saveSelfAssessment(
  labRunId: string,
  scores: Array<{ rubricItemId: string; selfScore: number }>
) {
  const client = await db()
  await Promise.all(
    scores.map((s) =>
      client.from('rubric_scores' as any).upsert(
        {
          lab_run_id: labRunId,
          rubric_item_id: s.rubricItemId,
          self_score: s.selfScore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lab_run_id,rubric_item_id' }
      )
    )
  )
  revalidatePath(`/student/labs/${labRunId}/complete`)
}
```

### Step 23 — Create `components/student/lab-runner/SelfAssessment.tsx`

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveSelfAssessment } from '@/features/lab-runner/actions'
import { Loader2, CheckCircle2, ClipboardCheck } from 'lucide-react'

interface RubricItem {
  id: string
  title: string
  description: string | null
  max_points: number
}

interface RubricScore {
  rubric_item_id: string
  self_score: number | null
  teacher_score: number | null
  teacher_comment: string | null
}

interface TeacherGrade {
  total_score: number | null
  max_score: number | null
  letter_grade: string | null
  overall_comment: string | null
  graded_at: string
}

interface SelfAssessmentProps {
  labRunId: string
  rubricItems: RubricItem[]
  existingScores: RubricScore[]
  teacherGrade: TeacherGrade | null
}

export function SelfAssessment({ labRunId, rubricItems, existingScores, teacherGrade }: SelfAssessmentProps) {
  const [selfScores, setSelfScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const item of rubricItems) {
      const existing = existingScores.find((s) => s.rubric_item_id === item.id)
      initial[item.id] = existing?.self_score?.toString() ?? ''
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasSelfScores = Object.values(selfScores).some((v) => v !== '')
  const hasTeacherGrade = !!teacherGrade

  async function handleSave() {
    setSaving(true)
    try {
      await saveSelfAssessment(
        labRunId,
        rubricItems.map((item) => ({
          rubricItemId: item.id,
          selfScore: Math.min(parseFloat(selfScores[item.id]) || 0, item.max_points),
        }))
      )
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <ClipboardCheck className="size-4" />
        Rubric & Self-Assessment
      </h2>

      <div className="space-y-3">
        {rubricItems.map((item) => {
          const score = existingScores.find((s) => s.rubric_item_id === item.id)
          return (
            <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.max_points} pts</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Self-assessment input */}
                {!hasTeacherGrade && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your self-score</p>
                    <input
                      type="number"
                      min="0"
                      max={item.max_points}
                      value={selfScores[item.id] ?? ''}
                      onChange={(e) =>
                        setSelfScores((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                )}
                {hasSelfScores && score?.self_score != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your self-score</p>
                    <p className="font-medium">{score.self_score} / {item.max_points}</p>
                  </div>
                )}
                {score?.teacher_score != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Teacher score</p>
                    <p className="font-medium text-primary">{score.teacher_score} / {item.max_points}</p>
                    {score.teacher_comment && (
                      <p className="text-xs text-muted-foreground mt-0.5">{score.teacher_comment}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {hasTeacherGrade && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 space-y-1">
          <p className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Final Grade: {teacherGrade.total_score} / {teacherGrade.max_score} pts
            {teacherGrade.letter_grade && ` · ${teacherGrade.letter_grade}`}
          </p>
          {teacherGrade.overall_comment && (
            <p className="text-sm text-green-700 dark:text-green-300">{teacherGrade.overall_comment}</p>
          )}
        </div>
      )}

      {!hasTeacherGrade && (
        <Button onClick={handleSave} disabled={saving || saved} size="sm" className="gap-2">
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {saved ? 'Saved!' : 'Save Self-Assessment'}
        </Button>
      )}
    </section>
  )
}
```

---

## After All Code Changes

1. Run the DB migration:
   ```bash
   cd "/Users/msh/LabFlow - Classroom Lab Manager"
   supabase db push
   ```

2. Run a build check:
   ```bash
   npm run build
   ```
   Fix any TypeScript errors before marking done.

3. Run the dev server and verify manually:
   ```bash
   npm run dev
   ```
   Verification checklist:
   - [ ] Log in as student → `/student` shows class-grouped dashboard (not a redirect)
   - [ ] Unstarted assignment shows "Start Lab" button → clicking it creates a run and navigates to overview
   - [ ] In-progress assignment shows progress bar and "Continue" button
   - [ ] Completed assignment shows "Complete" badge and "View" button
   - [ ] Log in as teacher → open lab edit → step 6 is "Rubric", step 7 is "Review & Publish"
   - [ ] Add rubric criteria, save → navigate away and back → criteria persisted
   - [ ] As student, open lab overview → rubric table visible at bottom
   - [ ] Submit lab → self-assessment form appears on complete page
   - [ ] Teacher goes to `/teacher/labs/[labId]/grade` → submitted students listed
   - [ ] Teacher grades a submission → scores + comment saved
   - [ ] Student revisits complete page → teacher grade and scores visible

4. Commit all changes:
   ```bash
   git add -A
   git commit -m "Add student dashboard + rubric and grading system"
   git push
   ```
