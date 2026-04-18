import type { DataEntryField, DataFlag } from '@/types/app'

export function validateDataEntry(
  fields: DataEntryField[],
  values: Record<string, unknown>
): DataFlag[] {
  const flags: DataFlag[] = []

  for (const field of fields) {
    const value = values[field.label]

    if (field.required && (value === undefined || value === null || value === '')) {
      flags.push({ field: field.label, rule: 'required_missing', message: 'This field is required.' })
      continue
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const num = Number(value)
      if (isNaN(num)) {
        flags.push({ field: field.label, rule: 'invalid_numeric', message: 'Must be a number.' })
        continue
      }
      if (field.min !== undefined && num < field.min) {
        flags.push({ field: field.label, rule: 'out_of_range_low', message: `Value is below expected minimum of ${field.min}${field.unit ? ' ' + field.unit : ''}.` })
      }
      if (field.max !== undefined && num > field.max) {
        flags.push({ field: field.label, rule: 'out_of_range_high', message: `Value is above expected maximum of ${field.max}${field.unit ? ' ' + field.unit : ''}.` })
      }
    }
  }

  return flags
}
