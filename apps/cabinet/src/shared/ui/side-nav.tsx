import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { buttonVariants } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export interface SideNavItem {
  to: string
  label: string
  icon: LucideIcon
}

/// Sahifa ichidagi chap navigatsiya. Katta ekranda tik roʻyxat, telefonda
/// tanlov qutisi — beshta-oltita tugma tor ekranga sigʻmaydi.
/// Har boʻlim oʻz manziliga ega: havola ulashiladi, «orqaga» ishlaydi
export function SideNav({ items }: { items: readonly SideNavItem[] }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = items.find((item) => item.to === pathname)?.to ?? items[0]?.to ?? ''

  return (
    <>
      <div className="md:hidden">
        <Select value={current} onValueChange={(to) => navigate(to)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map(({ to, label, icon: Icon }) => (
              <SelectItem key={to} value={to}>
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav className="hidden flex-col gap-1 md:flex">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: 'ghost' }),
                'justify-start',
                isActive ? 'bg-muted hover:bg-muted' : 'hover:bg-accent',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

/// Sarlavha + chap navigatsiya + mazmun — sozlamalar va bemor kartochkasi
/// uchun bir xil joylashuv
export function SideNavLayout({
  nav,
  children,
}: {
  nav: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-12">
      <aside className="lg:w-1/5">{nav}</aside>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  )
}
