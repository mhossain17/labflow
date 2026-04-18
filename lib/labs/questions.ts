import type { PreLabQuestion } from '@/types/app'
import type { Database, Json } from '@/types/database'

type PreLabQuestionRow = Database['public']['Tables']['pre_lab_questions']['Row']
const VALID_QUESTION_TYPES: PreLabQuestion['question_type'][] = [
  'short_answer',
  'multiple_choice',
  'true_false',
]

function parseQuestionType(
  value: string
): PreLabQuestion['question_type'] {
  if (VALID_QUESTION_TYPES.includes(value as PreLabQuestion['question_type'])) {
    return value as PreLabQuestion['question_type']
  }
  return 'short_answer'
}

function parseOptions(value: Json | null): string[] | null {
  if (!Array.isArray(value)) return null
  const options = value.filter((option): option is string => typeof option === 'string')
  return options.length > 0 ? options : null
}

export function normalizePreLabQuestions(
  questions: PreLabQuestionRow[] | null | undefined
): PreLabQuestion[] {
  return (questions ?? []).map((question) => ({
    ...question,
    question_type: parseQuestionType(question.question_type),
    options: parseOptions(question.options),
  }))
}
