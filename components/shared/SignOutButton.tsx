'use client'
import { signOut } from '@/lib/auth/actions'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <DropdownMenuItem
      className="cursor-pointer text-destructive focus:text-destructive"
      onSelect={() => signOut()}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </DropdownMenuItem>
  )
}
