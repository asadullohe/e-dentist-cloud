import { ADMIN_UI, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { BuildingIcon, ChartColumnIcon, LogOutIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAdmin } from '@/entities/admin'
import { useLogout } from '@/features/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'

const NAV = [
  { to: '/', end: true, label: ADMIN_UI.clinics, icon: BuildingIcon },
  { to: '/statistika', end: false, label: ADMIN_UI.stats, icon: ChartColumnIcon },
]

interface Props {
  collapsed: boolean
  /// Kichik ekranda menyu ustidan ochiladi — havola bosilganda yopilishi kerak
  onNavigate: () => void
}

export function Sidebar({ collapsed, onNavigate }: Props) {
  const { data: admin } = useAdmin()
  const { mutateAsync: logout } = useLogout()
  const initial = (admin?.fullName ?? admin?.email ?? '?').trim().charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 md:static',
        collapsed ? 'w-64 md:w-16' : 'w-64',
        // Kichik ekranda yigʻilgan holat = umuman koʻrinmaydi
        collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b px-4',
          collapsed && 'md:justify-center md:px-2',
        )}
      >
        {/* Ikonka bezak: yonida nom yozilgan, shuning uchun alt boʻsh */}
        <img src="/logo.png" alt="" className="size-8 shrink-0 rounded-md" />
        <div className={cn('min-w-0 leading-tight', collapsed && 'md:hidden')}>
          <div className="truncate font-semibold tracking-tight">
            {UI_TEXT.brand}
            <span className="text-brand-accent">.</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">{ADMIN_UI.login_title}</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-muted-foreground',
                collapsed && 'md:justify-center md:px-0',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className={cn(collapsed && 'md:hidden')}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none',
              'hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
              collapsed && 'md:justify-center md:px-0',
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {initial}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <div className="truncate text-sm">{admin?.fullName ?? ADMIN_UI.login_title}</div>
              <div className="truncate text-xs text-muted-foreground">{admin?.email}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {admin?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => void logout()}>
              <LogOutIcon />
              {UI_TEXT.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
