'use client'
import { useState } from 'react'
import { useFieldArray, Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
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
import { StepEditor } from './StepEditor'
import { Plus, GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { LabBuilderFormValues } from './LabBuilderForm'
import { cn } from '@/lib/utils'

interface StepItemProps {
  id: string
  stepIndex: number
  stepNumber: number
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<LabBuilderFormValues>
  onRemove: () => void
}

function SortableStepItem({
  id,
  stepIndex,
  stepNumber,
  title,
  control,
  register,
  watch,
  setValue,
  onRemove,
}: StepItemProps) {
  const [expanded, setExpanded] = useState(stepIndex === 0)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Step header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground w-8">
          {stepNumber}.
        </span>
        <span className="flex-1 text-sm font-medium truncate">
          {title || 'Untitled Step'}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="shrink-0"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0"
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>
      {/* Step content */}
      {expanded && (
        <div className="px-4 pb-4">
          <StepEditor
            stepIndex={stepIndex}
            control={control}
            register={register}
            watch={watch}
            setValue={setValue}
          />
        </div>
      )}
    </div>
  )
}

interface StepListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<LabBuilderFormValues>
}

export function StepList({ control, register, watch, setValue }: StepListProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      move(oldIndex, newIndex)
    }
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => {
            const title = watch(`steps.${index}.title`)
            return (
              <SortableStepItem
                key={field.id}
                id={field.id}
                stepIndex={index}
                stepNumber={index + 1}
                title={title}
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                onRemove={() => remove(index)}
              />
            )
          })}
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          append({
            id: undefined,
            title: '',
            instructions: '',
            checkpoint: '',
            reflection_prompt: '',
            troubleshooting: '',
            data_entry_fields: [],
            step_number: fields.length + 1,
          })
        }
      >
        <Plus className="size-4" />
        Add Step
      </Button>
    </div>
  )
}
