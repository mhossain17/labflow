'use client'
import { useState, useCallback } from 'react'
import { useAutoSave } from './useAutoSave'
import { validateDataEntry } from '@/lib/validations/data-flagging'
import type { DataEntryField, DataFlag } from '@/types/app'
import { saveStepResponse } from '@/features/lab-runner/actions'

export function useLabRun({
  labRunId,
  stepId,
  studentId,
  initialDataValues,
  initialReflection,
  fields,
}: {
  labRunId: string
  stepId: string
  studentId: string
  initialDataValues: Record<string, unknown>
  initialReflection: string
  fields: DataEntryField[]
}) {
  const [dataValues, setDataValues] = useState(initialDataValues)
  const [reflection, setReflection] = useState(initialReflection)
  const [flags, setFlags] = useState<DataFlag[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const performSave = useCallback(
    async (values: Record<string, unknown>, ref: string) => {
      setSaveStatus('saving')
      try {
        const newFlags = validateDataEntry(fields, values)
        setFlags(newFlags)
        await saveStepResponse(labRunId, stepId, studentId, values, ref, newFlags)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    },
    [labRunId, stepId, studentId, fields]
  )

  const { save } = useAutoSave(
    ({ values, ref }: { values: Record<string, unknown>; ref: string }) =>
      performSave(values, ref)
  )

  const updateField = (label: string, value: unknown) => {
    const newValues = { ...dataValues, [label]: value }
    setDataValues(newValues)
    save({ values: newValues, ref: reflection })
  }

  const updateReflection = (text: string) => {
    setReflection(text)
    save({ values: dataValues, ref: text })
  }

  return { dataValues, reflection, flags, saveStatus, updateField, updateReflection }
}
