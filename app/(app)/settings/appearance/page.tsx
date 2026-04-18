import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppearanceForm } from './AppearanceForm'
import type { Profile, Organization } from '@/types/app'

export default async function AppearancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: profileData } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as Profile | null

  let org: Organization | null = null
  if (profile?.organization_id) {
    const { data: orgData } = await db
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()
    org = orgData as Organization | null
  }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Appearance</CardTitle>
          <CardDescription>Customize how LabFlow looks for you</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>

      {org && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Branding</CardTitle>
            <CardDescription>Colors set by your school administrator (read-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: org.primary_color }}
                  />
                  <span className="text-sm text-muted-foreground font-mono">{org.primary_color}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Secondary Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: org.secondary_color }}
                  />
                  <span className="text-sm text-muted-foreground font-mono">{org.secondary_color}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
