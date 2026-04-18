import { getLabWithSteps } from '@/features/teacher/queries'
import { LabBuilderForm } from '@/components/teacher/lab-builder/LabBuilderForm'
import { notFound } from 'next/navigation'

interface EditLabPageProps {
  params: Promise<{ labId: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function EditLabPage({ params, searchParams }: EditLabPageProps) {
  const [{ labId }, { step }] = await Promise.all([params, searchParams])
  const initialStep = Math.max(1, Math.min(6, parseInt(step ?? '1', 10) || 1))
  const lab = await getLabWithSteps(labId)
  if (!lab) notFound()

  return <LabBuilderForm lab={lab} initialStep={initialStep} />
}
