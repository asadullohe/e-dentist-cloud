import { UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { LogOutIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useHasPermission, useSession } from '@/entities/session'
import { useLogout } from '@/features/auth'
import { NAV_SECTIONS } from '@/shared/config'
import { Button } from '@/shared/ui'

export function Sidebar() {
  const { data: session } = useSession()
  const hasPermission = useHasPermission()
  const { mutateAsync: logout } = useLogout()
  const navigate = useNavigate()

  const sections = NAV_SECTIONS.filter((section) => hasPermission(section.permission))

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="bg-brand-deep flex w-56 shrink-0 flex-col px-3.5 pt-5 pb-4 text-white/90">
      <div className="font-display px-2.5 text-xl font-bold tracking-tight text-white">
        {UI_TEXT.brand}
      </div>
      <div className="px-2.5 pt-1 pb-5 text-xs text-white/55">{session?.clinic?.name}</div>

      <nav className="flex flex-col gap-0.5">
        {sections.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/8',
              )
            }
          >
            <span className="w-5 text-center text-base">{section.icon}</span>
            {section.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 pt-2.5">
        <div className="mb-2 text-[11.5px] text-white/45">
          {session?.user.fullName} · {session?.role?.name}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full border-white/25 bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
        >
          <LogOutIcon />
          {UI_TEXT.logout}
        </Button>
      </div>
    </aside>
  )
}
