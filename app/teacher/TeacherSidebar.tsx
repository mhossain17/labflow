'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutList, FlaskConical, BookOpen, BarChart3 } from 'lucide-react'

const navLinks = [
  { href: '/teacher/classes', label: 'Classes', icon: LayoutList },
  { href: '/teacher/labs', label: 'Labs', icon: FlaskConical },
  { href: '/teacher/materials', label: 'Materials', icon: BookOpen },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
]

export function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r bg-card flex flex-col gap-1 p-4 shrink-0">
      <nav className="flex flex-col gap-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
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
        })}
      </nav>
    </aside>
  )
}
