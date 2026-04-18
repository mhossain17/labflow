import type { Metadata } from 'next'
import { DemoExperience } from '@/components/demo/DemoExperience'

export const metadata: Metadata = {
  title: 'LabFlow AI Demo',
  description: 'Interactive guided walkthrough of the LabFlow AI platform',
}

export default function DemoPage() {
  return <DemoExperience />
}
