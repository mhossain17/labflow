import type { UserRole } from '@/types/app'

export type DemoPersona = {
  id: string
  label: string
  role: UserRole
  email: string
  password: string
  description: string
}

export const DEMO_GATEWAY = {
  email: 'demo@westlake.demo',
  password: 'LabFlow2025!',
} as const

export const DEMO_GATEWAY_LOGIN_CANDIDATES = [
  DEMO_GATEWAY,
  { email: 'admin@westlake.demo', password: 'LabFlow2025!' },
] as const

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'school_admin',
    label: 'Demo Admin',
    role: 'school_admin',
    email: 'admin@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Branding, user management, feature flags, and admin settings.',
  },
  {
    id: 'teacher',
    label: 'Demo Teacher',
    role: 'teacher',
    email: 'teacher@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Class management, lab creation, monitor dashboard, and grading.',
  },
  {
    id: 'student',
    label: 'Student: Sam (On Track)',
    role: 'student',
    email: 'student1@westlake.demo',
    password: 'LabFlow2025!',
    description: 'On-track lab run with steady progress.',
  },
  {
    id: 'student_stuck',
    label: 'Student: Jordan (Stuck)',
    role: 'student',
    email: 'student2@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Stuck status to demonstrate intervention workflows.',
  },
  {
    id: 'student_help',
    label: 'Student: Alex (Needs Help)',
    role: 'student',
    email: 'student3@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Need-help status with teacher assist scenarios.',
  },
  {
    id: 'student_waiting',
    label: 'Student: Maya (Waiting Check)',
    role: 'student',
    email: 'student4@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Waiting-for-check state pending teacher review.',
  },
  {
    id: 'student_finished',
    label: 'Student: Ethan (Finished Step)',
    role: 'student',
    email: 'student5@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Finished-step status useful for class pacing views.',
  },
  {
    id: 'student_completed',
    label: 'Student: Sofia (Completed)',
    role: 'student',
    email: 'student6@westlake.demo',
    password: 'LabFlow2025!',
    description: 'Completed run for grading and analytics demos.',
  },
]

export const DEMO_ALLOWED_EMAILS = [
  DEMO_GATEWAY.email,
  ...DEMO_PERSONAS.map((persona) => persona.email),
] as const

export function isDemoEmail(email?: string | null) {
  if (!email) return false
  return DEMO_ALLOWED_EMAILS.some((value) => value === email.toLowerCase())
}

export function isDemoGatewayEmail(email?: string | null) {
  if (!email) return false
  return email.toLowerCase() === DEMO_GATEWAY.email
}
