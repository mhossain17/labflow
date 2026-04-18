'use client'
import { Control, UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DataFieldEditor } from './DataFieldEditor'
import type { LabBuilderFormValues } from './LabBuilderForm'

interface StepEditorProps {
  stepIndex: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
}

export function StepEditor({ stepIndex, control, register, watch }: StepEditorProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="space-y-1.5">
        <Label>Step Title</Label>
        <Input
          placeholder="e.g. Prepare the solution"
          {...register(`steps.${stepIndex}.title`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Instructions <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Write clear, step-by-step instructions for the student..."
          rows={4}
          {...register(`steps.${stepIndex}.instructions`, { required: true })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Checkpoint
          <span className="text-xs font-normal text-muted-foreground">(teacher check-in note)</span>
        </Label>
        <Textarea
          placeholder="Note for teacher to check student work before proceeding..."
          rows={2}
          {...register(`steps.${stepIndex}.checkpoint`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Reflection Prompt
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="What did you observe? Why do you think that happened?"
          rows={2}
          {...register(`steps.${stepIndex}.reflection_prompt`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Troubleshooting Tips
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="Common issues students encounter and how to resolve them..."
          rows={2}
          {...register(`steps.${stepIndex}.troubleshooting`)}
        />
      </div>
      <DataFieldEditor
        stepIndex={stepIndex}
        control={control}
        register={register}
        watch={watch}
      />
    </div>
  )
}
