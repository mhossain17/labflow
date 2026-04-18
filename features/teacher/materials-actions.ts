'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaterialRecord(data: {
  teacher_id: string
  organization_id: string
  file_name: string
  storage_path: string
  mime_type: string
  size_bytes: number
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record, error } = await (supabase as any)
    .from('teacher_materials')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  revalidatePath('/teacher/materials')
  return record
}

export async function deleteMaterial(materialId: string, storagePath: string) {
  const supabase = await createClient()
  // Remove from storage
  await supabase.storage.from('teacher-materials').remove([storagePath])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('teacher_materials')
    .delete()
    .eq('id', materialId)
  if (error) throw error
  revalidatePath('/teacher/materials')
}
