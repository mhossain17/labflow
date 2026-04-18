import type { DataEntryField, LabStep } from '@/types/app'
import type { Database, Json } from '@/types/database'

type LabStepRow = Database['public']['Tables']['lab_steps']['Row']

function parseDataEntryFields(value: Json | null): DataEntryField[] | null {
  if (!Array.isArray(value)) return null

  const fields: DataEntryField[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue

    const label = item.label
    const type = item.type
    const required = item.required

    if (typeof label !== 'string') continue
    if (type !== 'text' && type !== 'number') continue
    if (typeof required !== 'boolean') continue

    const field: DataEntryField = { label, type, required }
    if (typeof item.unit === 'string') field.unit = item.unit
    if (typeof item.min === 'number') field.min = item.min
    if (typeof item.max === 'number') field.max = item.max

    fields.push(field)
  }

  return fields
}

function normalizeLabStep(step: LabStepRow): LabStep {
  return {
    ...step,
    data_entry_fields: parseDataEntryFields(step.data_entry_fields),
  }
}

export function normalizeAndSortLabSteps(steps: LabStepRow[] | null | undefined): LabStep[] {
  return (steps ?? []).map(normalizeLabStep).sort((a, b) => a.step_number - b.step_number)
}
