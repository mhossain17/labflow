'use client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, Palette, LogOut, ShieldCheck } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

interface TopNavUserMenuProps {
  fullName: string
  email: string
  initials: string
  avatarUrl?: string | null
  role?: string
}

export function TopNavUserMenu({ fullName, email, initials, avatarUrl, role }: TopNavUserMenuProps) {
  const router = useRouter()
  const isAdmin = role === 'school_admin' || role === 'super_admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none rounded-full">
        <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push('/admin/branding')}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/settings/account')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/settings/appearance')}
        >
          <Palette className="mr-2 h-4 w-4" />
          Appearance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0 focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
