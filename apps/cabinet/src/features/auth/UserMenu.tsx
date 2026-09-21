import { STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { LogOutIcon, UserCogIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/entities/session'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { LogoutDialog } from './LogoutDialog'

/// Xodim menyusi — yon menyu pastida va telefonda tepa panelda bitta:
/// pochta, hisob, chiqish (tasdiq bilan). Tugma tashqaridan beriladi
export function UserMenu({
  children,
  side = 'top',
  className,
}: {
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}) {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={className}>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" side={side} className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
            {session?.user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Parolni almashtirish har xodimga kerak — Sozlamalar menyuda
              boʻlsa ham, shu yerdan topish osonroq */}
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <UserCogIcon />
            {STAFF_UI.account_tab}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}>
            <LogOutIcon />
            {UI_TEXT.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  )
}
