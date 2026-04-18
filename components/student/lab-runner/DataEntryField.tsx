'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FlagWarning } from './FlagWarning'
import type { DataEntryField as DataEntryFieldType, DataFlag } from '@/types/app'

interface DataEntryFieldProps {
  field: DataEntryFieldType
  value: unknown
  onChange: (value: string) => void
  flags: DataFlag[]
}

export function DataEntryField({ field, value, onChange, flags }: DataEntryFieldProps) {
  const flag = flags.find((f) => f.field === field.label)
  const hasFlag = !!flag
  const strValue = value !== undefined && value !== null ? String(value) : ''

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.label} className="text-sm font-medium">
        {field.label}
        {field.unit && (
          <span className="ml-1 text-xs text-muted-foreground font-normal">({field.unit})</span>
        )}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Input
        id={field.label}
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? 'any' : undefined}
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === 'number' ? '0' : 'Enter value...'}
        className={
          hasFlag
            ? 'border-red-400 focus-visible:ring-red-400'
            : strValue.length > 0
            ? 'border-green-500 focus-visible:ring-green-500'
            : ''
        }
      />

      {hasFlag && <FlagWarning message={flag.message} />}
    </div>
  )
}
