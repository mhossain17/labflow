'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Paintbrush, Users, Settings, ToggleLeft, LayoutList, FlaskConical, BookOpen, BarChart3, ClipboardList } from 'lucide-react'

const adminLinks = [
  { href: '/admin/branding', label: 'Branding', icon: Paintbrush },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardList },
]

const teacherLinks = [
  { href: '/teacher/classes', label: 'Classes', icon: LayoutList },
  { href: '/teacher/labs', label: 'Labs', icon: FlaskConical },
  { href: '/teacher/materials', label: 'Materials', icon: BookOpen },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-56 border-r bg-card flex flex-col p-4 shrink-0 gap-4">
      <nav className="flex flex-col gap-1">
        {adminLinks.map(link => <NavLink key={link.href} {...link} />)}
      </nav>
      <div className="border-t border-border pt-3">
        <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teacher</p>
        <nav className="flex flex-col gap-1">
          {teacherLinks.map(link => <NavLink key={link.href} {...link} />)}
        </nav>
      </div>
    </aside>
  )
}
