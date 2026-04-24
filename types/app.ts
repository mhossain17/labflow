export type UserRole = 'teacher' | 'student' | 'school_admin' | 'super_admin'
export type ProfileStatus = 'active' | 'pending_review'
export type ThemePreference = 'light' | 'dark' | 'system'
export type LabStatus = 'draft' | 'published' | 'archived'
export type StudentWorkStatus = 'on_track' | 'need_help' | 'stuck' | 'waiting_for_check' | 'finished_step'

export type Profile = {
  id: string
  organization_id: string | null
  role: UserRole
  status: ProfileStatus
  first_name: string
  last_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Organization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  student_code: string | null
  staff_code: string | null
  created_at: string
  updated_at: string
}

export type UserSettings = {
  id: string
  user_id: string
  theme: ThemePreference
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export type Class = {
  id: string
  organization_id: string
  teacher_id: string
  created_by: string | null
  name: string
  description: string | null
  period: string | null
  school_year: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export type ClassRole = 'lead_teacher' | 'co_teacher'

export type ClassTeacher = {
  id: string
  class_id: string
  teacher_id: string
  class_role: ClassRole
  can_manage_roster: boolean
  can_manage_assignments: boolean
  can_manage_grades: boolean
  can_edit_class_settings: boolean
  added_by: string | null
  created_at: string
}

export type ClassTeacherWithProfile = ClassTeacher & {
  profiles: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }
}

export type DataEntryField = {
  label: string
  type: 'text' | 'number'
  unit?: string
  min?: number
  max?: number
  required: boolean
}

export type LabStep = {
  id: string
  lab_id: string
  step_number: number
  title: string
  instructions: string
  checkpoint: string | null
  data_entry_fields: DataEntryField[] | null
  reflection_prompt: string | null
  troubleshooting: string | null
  image_url: string | null
  created_at: string
}

export type PreLabQuestion = {
  id: string
  lab_id: string
  position: number
  question_text: string
  question_type: 'short_answer' | 'multiple_choice' | 'true_false'
  options: string[] | null
  correct_answer: string | null
  required: boolean
  created_at: string
}

export type Lab = {
  id: string
  organization_id: string
  teacher_id: string
  title: string
  overview: string | null
  objectives: string[]
  standards: string[]
  materials_list: string[]
  safety_notes: string | null
  background: string | null
  teacher_notes: string | null
  status: LabStatus
  ai_generated: boolean
  estimated_minutes: number | null
  created_at: string
  updated_at: string
}

export type LabWithSteps = Lab & {
  lab_steps: LabStep[]
  pre_lab_questions: PreLabQuestion[]
}

export type StudentLabRun = {
  id: string
  assignment_id: string
  student_id: string
  lab_id: string
  current_step: number
  prelab_completed: boolean
  status: StudentWorkStatus
  quick_note: string | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

export type DataFlag = {
  field: string
  rule: string
  message: string
}

export type StepDataValue = string | number | boolean | null
export type StepDataValues = Record<string, StepDataValue>

export type FeatureFlags = {
  ai_lab_generation: boolean
  help_chat: boolean
  analytics: boolean
}

export type HelpConversationTurn = {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

export type EscalatedHelpRequest = {
  id: string
  lab_run_id: string
  student_id: string
  first_name: string
  last_name: string
  conversation: HelpConversationTurn[]
  step_id: string | null
  resolved: boolean
  escalated_to_teacher: boolean
  created_at: string
}
