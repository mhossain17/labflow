export type DemoAssignmentStatus = 'not_started' | 'in_progress' | 'complete'

export interface DemoDashboardAssignment {
  id: string
  title: string
  dueText: string
  estimatedMinutes: number
  status: DemoAssignmentStatus
  currentStep: number
  totalSteps: number
}

export interface DemoPreLabItem {
  question: string
  answer: string
}

export interface DemoStepEntry {
  stepNumber: number
  title: string
  dataFields: Array<{ label: string; value: string }>
  reflection: string
}

export interface DemoRubricCriterion {
  id: string
  title: string
  description: string
  maxPoints: number
}

export interface DemoRubricScoreSnapshot {
  criterionId: string
  selfScore: number
  teacherScore: number
  teacherComment: string
}

export interface DemoFinalGradeSnapshot {
  totalScore: number
  maxScore: number
  letterGrade: string
  overallComment: string
}

export const DEMO_STUDENT_PROFILE = {
  studentName: 'Avery Johnson',
  classLabel: 'Biology Period 2',
  teacherName: 'Ms. Rivera',
  classCount: 3,
}

export const DEMO_STUDENT_ASSIGNMENTS: DemoDashboardAssignment[] = [
  {
    id: 'photosynthesis_lab',
    title: 'Investigating Photosynthesis Through Light Intensity',
    dueText: 'Due today',
    estimatedMinutes: 45,
    status: 'not_started',
    currentStep: 0,
    totalSteps: 2,
  },
  {
    id: 'density_review',
    title: 'Density Lab Review',
    dueText: 'Completed last week',
    estimatedMinutes: 30,
    status: 'complete',
    currentStep: 3,
    totalSteps: 3,
  },
  {
    id: 'enzyme_activity',
    title: 'Enzyme Activity Factors',
    dueText: 'Due Friday',
    estimatedMinutes: 40,
    status: 'not_started',
    currentStep: 0,
    totalSteps: 3,
  },
]

export const DEMO_PRELAB_ITEMS: DemoPreLabItem[] = [
  {
    question: 'Explain photosynthesis in one sentence.',
    answer: 'Photosynthesis converts light energy into chemical energy stored in glucose.',
  },
  {
    question: 'Predict what happens to oxygen output as light gets closer.',
    answer: 'I predict oxygen bubble count increases as the light source moves closer to the plant.',
  },
]

export const DEMO_STEP_ENTRIES: DemoStepEntry[] = [
  {
    stepNumber: 1,
    title: 'Baseline Measurement',
    dataFields: [
      { label: 'Light Distance (cm)', value: '20' },
      { label: 'Bubble Count (1 min)', value: '14' },
    ],
    reflection:
      'At 20cm, photosynthesis is active but moderate. The bubble count gives us a clear baseline.',
  },
  {
    stepNumber: 2,
    title: 'Close-Light Trial',
    dataFields: [
      { label: 'Light Distance (cm)', value: '10' },
      { label: 'Bubble Count (1 min)', value: '24' },
    ],
    reflection:
      'At 10cm, oxygen production increased, supporting the prediction that higher light intensity boosts photosynthesis rate.',
  },
]

export const DEMO_RUBRIC_CRITERIA: DemoRubricCriterion[] = [
  {
    id: 'claim_hypothesis',
    title: 'Claim and Hypothesis Quality',
    description: 'States a clear, testable claim tied to the lab question.',
    maxPoints: 10,
  },
  {
    id: 'data_accuracy',
    title: 'Data Collection Accuracy',
    description: 'Records complete and consistent measurements across trials.',
    maxPoints: 10,
  },
  {
    id: 'analysis_reasoning',
    title: 'Data Analysis and Reasoning',
    description: 'Interprets data trends and supports conclusions with evidence.',
    maxPoints: 10,
  },
  {
    id: 'reflection_quality',
    title: 'Reflection and Scientific Communication',
    description: 'Communicates insight and next steps with scientific vocabulary.',
    maxPoints: 10,
  },
]

export const DEMO_RUBRIC_SCORES: DemoRubricScoreSnapshot[] = [
  {
    criterionId: 'claim_hypothesis',
    selfScore: 8,
    teacherScore: 9,
    teacherComment: 'Strong claim and prediction. Include variable controls explicitly.',
  },
  {
    criterionId: 'data_accuracy',
    selfScore: 7,
    teacherScore: 8,
    teacherComment: 'Data table is complete; one trial needed clearer units.',
  },
  {
    criterionId: 'analysis_reasoning',
    selfScore: 8,
    teacherScore: 9,
    teacherComment: 'Excellent evidence-based reasoning with accurate trend explanation.',
  },
  {
    criterionId: 'reflection_quality',
    selfScore: 7,
    teacherScore: 8,
    teacherComment: 'Reflection is thoughtful. Add one concrete improvement for next run.',
  },
]

export const DEMO_FINAL_GRADE: DemoFinalGradeSnapshot = {
  totalScore: 34,
  maxScore: 40,
  letterGrade: 'A-',
  overallComment:
    'Great scientific thinking and strong use of evidence. Focus on unit precision and next-step planning.',
}

export function summarizeAssignments(assignments: DemoDashboardAssignment[]) {
  const inProgress = assignments.filter((item) => item.status === 'in_progress').length
  const complete = assignments.filter((item) => item.status === 'complete').length
  const notStarted = assignments.filter((item) => item.status === 'not_started').length

  return { inProgress, complete, notStarted }
}

export function assignmentProgressPercent(assignment: DemoDashboardAssignment) {
  if (assignment.totalSteps <= 0) return 0
  return Math.round((assignment.currentStep / assignment.totalSteps) * 100)
}

