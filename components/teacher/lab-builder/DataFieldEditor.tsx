'use client'
import { useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import type { LabBuilderFormValues } from './LabBuilderForm'

interface DataFieldEditorProps {
  stepIndex: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<LabBuilderFormValues>
}

export function DataFieldEditor({ stepIndex, control, register, watch, setValue }: DataFieldEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `steps.${stepIndex}.data_entry_fields`,
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Data Entry Fields
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => append({ label: '', type: 'text', unit: '', required: true })}
        >
          <Plus className="size-3.5" />
          Add Field
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No data fields. Add one for students to record measurements.</p>
      )}
      {fields.map((field, fieldIdx) => {
        const fieldType = watch(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.type`)
        return (
          <div key={field.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Field {fieldIdx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(fieldIdx)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="e.g. Temperature"
                  className="h-7 text-xs"
                  {...register(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.label`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                  {...register(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.type`)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
              </div>
            </div>
            {fieldType === 'number' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    placeholder="e.g. °C"
                    className="h-7 text-xs"
                    {...register(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.unit`)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    className="h-7 text-xs"
                    {...register(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.min`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    className="h-7 text-xs"
                    {...register(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.max`, { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id={`field-required-${stepIndex}-${fieldIdx}`}
                checked={watch(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.required`)}
                onCheckedChange={(checked) =>
                  setValue(`steps.${stepIndex}.data_entry_fields.${fieldIdx}.required`, checked)
                }
              />
              <Label htmlFor={`field-required-${stepIndex}-${fieldIdx}`} className="text-xs">Required</Label>
            </div>
          </div>
        )
      })}
    </div>
  )
}
