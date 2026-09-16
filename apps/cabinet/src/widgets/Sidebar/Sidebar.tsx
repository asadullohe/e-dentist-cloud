import { clinicLogoUrl, roleLabel, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { ChevronRightIcon, LogOutIcon, UserCogIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useHasPermission, useSession } from '@/entities/session'
import { useLogout } from '@/features/auth'
import { type NavSection, navSections } from '@/shared/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui'

interface Props {
  collapsed: boolean
  /// Tor ekranda menyu kontent ustidan ochiladi — havola bosilganda yopilsin
  onNavigate: () => void
}

/// Yon menyu — panel bilan bitta tuzilma: och fon, yigʻiladigan, lucide
/// ikonkalar. Tepada klinika (logotipi bilan), pastda xodim
export function Sidebar({ collapsed, onNavigate }: Props) {
  const { data: session } = useSession()
  const hasPermission = useHasPermission()
  const { mutateAsync: logout } = useLogout()
  const navigate = useNavigate()

  const clinic = session?.clinic ?? null
  const sections = navSections().filter(
    (section) => !section.permission || hasPermission(section.permission),
  )
  const initial = (session?.user.fullName ?? session?.user.email ?? '?').trim().charAt(0)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 md:static',
        collapsed ? 'w-64 md:w-16' : 'w-64',
        collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
      )}
    >
      {/* Klinika nomi — bosh sahifaga havola: odat boʻyicha logotip uyga qaytaradi */}
      <Link
        to="/"
        onClick={onNavigate}
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b px-4 outline-none',
          'hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50',
          collapsed && 'md:justify-center md:px-2',
        )}
      >
        {/* Klinikaning oʻz logotipi; yoʻq boʻlsa — mahsulot belgisi */}
        <img
          src={clinic?.logoKey ? clinicLogoUrl(clinic.queueCode) : '/logo.png'}
          alt=""
          className="size-8 shrink-0 rounded-md object-contain"
        />
        <div className={cn('min-w-0 leading-tight', collapsed && 'md:hidden')}>
          <div className="truncate text-sm font-semibold">{clinic?.name ?? UI_TEXT.brand}</div>
          <div className="truncate text-xs text-muted-foreground">{UI_TEXT.brand}</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {sections.map((section) =>
          section.children && !collapsed ? (
            <NavGroup
              key={section.path}
              section={section}
              items={section.children.filter(
                (item) => !item.permission || hasPermission(item.permission),
              )}
              onNavigate={onNavigate}
            />
          ) : (
            <NavItem
              key={section.path}
              section={section}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ),
        )}
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary uppercase">
              {initial}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <div className="truncate text-sm">
                {session?.user.fullName ?? session?.user.email}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {session?.role && roleLabel(session.role)}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
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
            <DropdownMenuItem variant="destructive" onSelect={() => void handleLogout()}>
              <LogOutIcon />
              {UI_TEXT.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

const linkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    isActive
      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
      : 'text-muted-foreground',
  )

function NavItem({
  section,
  collapsed,
  onNavigate,
}: {
  section: NavSection
  collapsed: boolean
  onNavigate: () => void
}) {
  const Icon = section.icon
  return (
    <NavLink
      to={section.path}
      // «/» — faqat aynan bosh sahifada faol, boshqa yoʻllarning boshi emas
      end={section.path === '/'}
      onClick={onNavigate}
      title={collapsed ? section.label : undefined}
      className={({ isActive }) =>
        cn(linkClass(isActive), collapsed && 'md:justify-center md:px-0')
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className={cn(collapsed && 'md:hidden')}>{section.label}</span>
    </NavLink>
  )
}

/// Ochiladigan guruh: sarlavha bosilganda ichki havolalar chiqadi.
/// Ichidagi sahifada turgan boʻlsak — avvaldan ochiq
function NavGroup({
  section,
  items,
  onNavigate,
}: {
  section: NavSection
  items: readonly { to: string; label: string }[]
  onNavigate: () => void
}) {
  const { pathname } = useLocation()
  const active = pathname.startsWith(section.path)
  const [open, setOpen] = useState(active)
  const Icon = section.icon

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(linkClass(false), 'w-full', active && 'text-sidebar-accent-foreground')}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronRightIcon
          className={cn('size-4 shrink-0 transition-transform duration-200', open && 'rotate-90')}
        />
      </button>

      {open && (
        <ul className="mt-1 ml-5 flex flex-col gap-0.5 border-l pl-3">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-muted-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
