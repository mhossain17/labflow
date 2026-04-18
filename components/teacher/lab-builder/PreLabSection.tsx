'use client'
import { useFieldArray, Control, UseFormRegister, UseFormWatch, Controller } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import type { LabBuilderFormValues } from './LabBuilderForm'
import { cn } from '@/lib/utils'

interface QuestionItemProps {
  id: string
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
  onRemove: () => void
}

function SortableQuestion({ id, index, control, register, watch, onRemove }: QuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const questionType = watch(`pre_lab_questions.${index}.question_type`)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-border bg-card p-4 space-y-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-sm font-medium flex-1">Question {index + 1}</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Question</Label>
        <Textarea
          placeholder="Enter your question..."
          rows={2}
          {...register(`pre_lab_questions.${index}.question_text`)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register(`pre_lab_questions.${index}.question_type`)}
        >
          <option value="short_answer">Short Answer</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True / False</option>
        </select>
      </div>

      {questionType === 'multiple_choice' && (
        <MultipleChoiceOptions index={index} control={control} register={register} />
      )}

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={`pre_lab_questions.${index}.required`}
          render={({ field }) => (
            <Switch
              id={`q-required-${index}`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor={`q-required-${index}`} className="text-xs">Required</Label>
      </div>
    </div>
  )
}

function MultipleChoiceOptions({
  index,
  control,
  register,
}: {
  index: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `pre_lab_questions.${index}.options` as never,
  })

  return (
    <div className="space-y-2">
      <Label className="text-xs">Options</Label>
      {fields.map((opt, optIdx) => (
        <div key={opt.id} className="flex gap-2">
          <Input
            placeholder={`Option ${optIdx + 1}`}
            className="h-7 text-xs"
            {...register(`pre_lab_questions.${index}.options.${optIdx}` as never)}
          />
          <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(optIdx)}>
            <Trash2 className="size-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => append('' as never)}
      >
        <Plus className="size-3.5" />
        Add Option
      </Button>
    </div>
  )
}

interface PreLabSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
}

export function PreLabSection({ control, register, watch }: PreLabSectionProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'pre_lab_questions',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = fields.findIndex((f) => f.id === active.id)
      const newIdx = fields.findIndex((f) => f.id === over.id)
      move(oldIdx, newIdx)
    }
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableQuestion
              key={field.id}
              id={field.id}
              index={index}
              control={control}
              register={register}
              watch={watch}
              onRemove={() => remove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 italic">
          No pre-lab questions yet. Add some to help students prepare.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          append({
            id: undefined,
            question_text: '',
            question_type: 'short_answer',
            options: [],
            required: true,
            position: fields.length,
          })
        }
      >
        <Plus className="size-4" />
        Add Question
      </Button>
    </div>
  )
}
