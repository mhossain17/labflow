import { getProfile } from '@/lib/auth/session'
import {
  checkLabRunOwnership,
  getLabRunWithSteps,
  getPreLabResponses,
} from '@/features/lab-runner/queries'
import { notFound, redirect } from 'next/navigation'
import { PreLabRunner } from '@/components/student/lab-runner/PreLabRunner'
import { normalizePreLabQuestions } from '@/lib/labs/questions'

interface Props {
  params: Promise<{ labRunId: string }>
}

export default async function PreLabPage({ params }: Props) {
  const { labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const isOwner = await checkLabRunOwnership(labRunId, profile.id)
  if (!isOwner) notFound()

  const run = await getLabRunWithSteps(labRunId)
  if (!run) notFound()
  const labRun = run

  // If prelab already completed, redirect to step 1
  if (labRun.prelab_completed) {
    redirect(`/student/labs/${labRunId}/step/1`)
  }

  const questions = normalizePreLabQuestions(labRun.labs?.pre_lab_questions)
  const existingResponses = (await getPreLabResponses(labRunId)).map((response) => ({
    ...response,
    response_text: response.response_text ?? '',
  }))

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-1 mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          {labRun.labs?.title}
        </p>
        <h1 className="text-2xl font-bold">Pre-Lab Questions</h1>
        <p className="text-sm text-muted-foreground">
          Complete these questions before starting the lab procedure.
        </p>
      </div>

      <PreLabRunner
        labRunId={labRunId}
        studentId={profile.id}
        questions={questions}
        existingResponses={existingResponses}
      />
    </div>
  )
}
