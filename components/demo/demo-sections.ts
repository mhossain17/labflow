export type DemoSectionId =
  | 'intro'
  | 'teacher_lab_creation'
  | 'student_experience'
  | 'student_gets_stuck'
  | 'teacher_dashboard'
  | 'rubric_grading'
  | 'admin_branding'
  | 'analytics_impact'

export interface DemoSectionConfig {
  id: DemoSectionId
  label: string
  title: string
  description: string
  autoAdvanceMs: number
  implemented: boolean
}

export const DEMO_SECTIONS: DemoSectionConfig[] = [
  {
    id: 'intro',
    label: '01',
    title: 'Intro / Landing',
    description: 'Welcome to LabFlow AI and start the guided walkthrough.',
    autoAdvanceMs: 9000,
    implemented: true,
  },
  {
    id: 'teacher_lab_creation',
    label: '02',
    title: 'Teacher Lab Creation',
    description: 'Simulate AI generating a complete lab builder draft.',
    autoAdvanceMs: 13000,
    implemented: true,
  },
  {
    id: 'student_experience',
    label: '03',
    title: 'Student Experience',
    description: 'Student dashboard, pre-lab completion, and step progression.',
    autoAdvanceMs: 14000,
    implemented: true,
  },
  {
    id: 'student_gets_stuck',
    label: '04',
    title: 'Student Gets Stuck',
    description: 'Status changes to stuck and AI help guidance appears.',
    autoAdvanceMs: 9000,
    implemented: true,
  },
  {
    id: 'teacher_dashboard',
    label: '05',
    title: 'Teacher Dashboard',
    description: 'Live classroom statuses with stuck-step insight highlight.',
    autoAdvanceMs: 10000,
    implemented: true,
  },
  {
    id: 'rubric_grading',
    label: '06',
    title: 'Rubric & Grading System',
    description: 'Rubric authoring, self-assessment, teacher grading, and final grade reveal.',
    autoAdvanceMs: 14000,
    implemented: true,
  },
  {
    id: 'admin_branding',
    label: '07',
    title: 'Admin Branding Panel',
    description: 'Brand updates and dark mode preview in real time.',
    autoAdvanceMs: 8000,
    implemented: true,
  },
  {
    id: 'analytics_impact',
    label: '08',
    title: 'Analytics / Impact',
    description: 'Progress and stuck-point chart storytelling.',
    autoAdvanceMs: 8000,
    implemented: true,
  },
]
