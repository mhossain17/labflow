import { getLabWithSteps } from '@/features/teacher/queries'
import { LabBuilderForm } from '@/components/teacher/lab-builder/LabBuilderForm'
import { notFound } from 'next/navigation'

interface EditLabPageProps {
  params: Promise<{ labId: string }>
}

export default async function EditLabPage({ params }: EditLabPageProps) {
  const { labId } = await params
  const lab = await getLabWithSteps(labId)
  if (!lab) notFound()

  return <LabBuilderForm lab={lab} />
}
