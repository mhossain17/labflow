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
  classLabel: 'Period 2',
  teacherName: 'Ms. Rivera',
  classCount: 3,
}

export const DEMO_STUDENT_ASSIGNMENTS: DemoDashboardAssignment[] = [
  {
    id: 'variables_lab',
    title: 'Investigating Variables Through Controlled Trials',
    dueText: 'Due today',
    estimatedMinutes: 45,
    status: 'not_started',
    currentStep: 0,
    totalSteps: 2,
  },
  {
    id: 'measurement_lab',
    title: 'Measurement and Data Collection Lab',
    dueText: 'Completed last week',
    estimatedMinutes: 30,
    status: 'complete',
    currentStep: 3,
    totalSteps: 3,
  },
  {
    id: 'cause_effect_lab',
    title: 'Cause and Effect: Analyzing Results',
    dueText: 'Due Friday',
    estimatedMinutes: 40,
    status: 'not_started',
    currentStep: 0,
    totalSteps: 3,
  },
]

export const DEMO_PRELAB_ITEMS: DemoPreLabItem[] = [
  {
    question: 'Describe what an independent variable is in your own words.',
    answer: 'An independent variable is the one factor you intentionally change to see how it affects the outcome.',
  },
  {
    question: 'What do you predict will happen as the independent variable increases?',
    answer: 'I predict the measured output will increase proportionally as the independent variable increases.',
  },
]

export const DEMO_STEP_ENTRIES: DemoStepEntry[] = [
  {
    stepNumber: 1,
    title: 'Baseline Measurement',
    dataFields: [
      { label: 'Trial Distance (cm)', value: '20' },
      { label: 'Data Count (avg)', value: '14' },
    ],
    reflection:
      'At the baseline setting, the output was moderate and consistent. This gives us a reliable control point for comparison.',
  },
  {
    stepNumber: 2,
    title: 'Variable Trial',
    dataFields: [
      { label: 'Trial Distance (cm)', value: '10' },
      { label: 'Data Count (avg)', value: '24' },
    ],
    reflection:
      'When the variable changed, the measured output increased noticeably, supporting our prediction that the two are positively correlated.',
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

