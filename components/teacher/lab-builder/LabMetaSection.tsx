'use client'
import { useFieldArray, Control, UseFormRegister } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { LabBuilderFormValues } from './LabBuilderForm'

interface LabMetaSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
}

export function LabMetaSection({ control, register }: LabMetaSectionProps) {
  const { fields: objectives, append: addObjective, remove: removeObjective } = useFieldArray({
    control,
    name: 'objectives',
  })
  const { fields: standards, append: addStandard, remove: removeStandard } = useFieldArray({
    control,
    name: 'standards',
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Lab Title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          placeholder="e.g. Variables and Controlled Trials Lab"
          {...register('title', { required: true })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="overview">Overview</Label>
        <Textarea
          id="overview"
          placeholder="Briefly describe what students will do and learn in this lab..."
          rows={3}
          {...register('overview')}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Learning Objectives</Label>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => addObjective({ value: '' })}
          >
            <Plus className="size-3.5" />
            Add Objective
          </Button>
        </div>
        {objectives.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No objectives added.</p>
        )}
        {objectives.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder={`Objective ${index + 1}`}
              {...register(`objectives.${index}.value`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeObjective(index)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Standards</Label>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => addStandard({ value: '' })}
          >
            <Plus className="size-3.5" />
            Add Standard
          </Button>
        </div>
        {standards.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No standards added.</p>
        )}
        {standards.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder={`e.g. NGSS HS-LS1-5`}
              {...register(`standards.${index}.value`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeStandard(index)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="estimated_minutes">Estimated Duration (minutes)</Label>
        <Input
          id="estimated_minutes"
          type="number"
          placeholder="e.g. 50"
          className="max-w-40"
          {...register('estimated_minutes', { valueAsNumber: true })}
        />
      </div>
    </div>
  )
}
