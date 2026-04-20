'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LayoutList, FlaskConical, BookOpen, BarChart3, Paintbrush, Users, Settings, ToggleLeft, ShieldCheck, ChevronDown, GraduationCap } from 'lucide-react'

const teacherLinks = [
  { href: '/teacher/classes', label: 'Classes', icon: LayoutList },
  { href: '/teacher/labs', label: 'Labs', icon: FlaskConical },
  { href: '/teacher/grades', label: 'Grades', icon: GraduationCap },
  { href: '/teacher/materials', label: 'Materials', icon: BookOpen },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
]

const adminLinks = [
  { href: '/admin/branding', label: 'Branding', icon: Paintbrush },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
]

interface TeacherSidebarProps {
  role?: string
}

export function TeacherSidebar({ role }: TeacherSidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'school_admin' || role === 'super_admin'
  const isOnAdminPath = pathname.startsWith('/admin')
  const [adminOpen, setAdminOpen] = useState(isOnAdminPath)

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
    <aside className="w-56 border-r bg-card flex flex-col p-4 shrink-0">
      <nav className="flex flex-col gap-1 flex-1">
        {teacherLinks.map(link => <NavLink key={link.href} {...link} />)}
      </nav>

      {isAdmin && (
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setAdminOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Settings
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', adminOpen && 'rotate-180')} />
          </button>
          {adminOpen && (
            <nav className="flex flex-col gap-1 mt-1">
              {adminLinks.map(link => <NavLink key={link.href} {...link} />)}
            </nav>
          )}
        </div>
      )}
    </aside>
  )
}
