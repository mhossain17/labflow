import { requireRole } from '@/lib/auth/role-guard'
import { TopNav } from '@/components/shared/TopNav'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['super_admin'])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r bg-card flex flex-col p-4 shrink-0">
          <div className="flex items-center gap-2 px-3 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Platform Admin</span>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/super-admin"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Organizations
            </Link>
            <Link
              href="/super-admin/users"
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Users
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
