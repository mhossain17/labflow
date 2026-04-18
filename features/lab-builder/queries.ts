import { createClient } from '@/lib/supabase/server'

export async function getLabWithSteps(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('labs')
    .select('*, lab_steps(*), pre_lab_questions(*)')
    .eq('id', labId)
    .single()
  return data
}

export async function getRubricItems(labId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db
    .from('rubric_items')
    .select('*')
    .eq('lab_id', labId)
    .order('position', { ascending: true })
  return (data ?? []) as Array<{
    id: string
    lab_id: string
    title: string
    description: string | null
    max_points: number
    position: number
    created_at: string
  }>
}

export async function listLabsByTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('labs')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  return data ?? []
}
