import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucket, path: filePath, contentType } = await request.json()

  const allowedBuckets = ['org-logos', 'teacher-materials', 'step-images']
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // contentType is accepted for future use but createSignedUploadUrl doesn't require it
  void contentType

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path })
}
