import type { DataFlag, StepDataValue, StepDataValues } from '@/types/app'
import type { Json } from '@/types/database'

export function normalizeStepDataValues(value: Json | null): StepDataValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const normalized: StepDataValues = {}
  for (const [key, entry] of Object.entries(value)) {
    if (
      entry === null ||
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean'
    ) {
      normalized[key] = entry as StepDataValue
    }
  }

  return normalized
}

export function normalizeDataFlags(value: Json | null): DataFlag[] {
  if (!Array.isArray(value)) return []

  const flags: DataFlag[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const field = item.field
    const rule = item.rule
    const message = item.message

    if (typeof field !== 'string') continue
    if (typeof rule !== 'string') continue
    if (typeof message !== 'string') continue

    flags.push({ field, rule, message })
  }

  return flags
}
