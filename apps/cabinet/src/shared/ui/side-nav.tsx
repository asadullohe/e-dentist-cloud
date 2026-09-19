import { cn } from 'cn'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { buttonVariants } from './button'

export interface SideNavItem {
  to: string
  label: string
  icon: LucideIcon
}

/// Sahifa ichidagi navigatsiya. Katta ekranda chapda tik roʻyxat, telefonda
/// gorizontal aylanadigan tablar — hamma boʻlim koʻrinib turadi, joriysi
/// chizilgan (tanlov qutisi tushunarsiz edi). Har boʻlim oʻz manziliga
/// ega: havola ulashiladi, «orqaga» ishlaydi
export function SideNav({ items }: { items: readonly SideNavItem[] }) {
  const { pathname } = useLocation()
  const strip = useRef<HTMLDivElement>(null)

  // Joriy tab ekrandan tashqarida qolsa — koʻrinadigan joyga suriladi
  useEffect(() => {
    const active = strip.current?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <>
      <div
        ref={strip}
        className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-1 border-b">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  '-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>
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
