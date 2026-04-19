import type { Metadata } from 'next'
import { DemoTryLive } from '@/components/demo/DemoTryLive'

export const metadata: Metadata = {
  title: 'Try LabFlow Live',
  description: 'Log in as a teacher, student, or admin to explore LabFlow with real demo data.',
}

export default function DemoTryPage() {
  return <DemoTryLive />
}
