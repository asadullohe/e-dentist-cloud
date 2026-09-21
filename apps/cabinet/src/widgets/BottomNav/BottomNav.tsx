import { DOCK_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { EllipsisIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useHasPermission } from '@/entities/session'
import { FeedbackDot, QueueBadge } from './badges'
import { activePath, dockItems } from './dockItems'
import { MoreSheet } from './MoreSheet'
import { useDockHidden } from './useDockState'

/// Telefondagi pastki dok — iOS 26 «Liquid Glass» uslubida: suzuvchi shisha
/// kapsula, faol tab ostida linza (tabdan tabga suzib oʻtadi), yonida
/// alohida dumaloq «Yana». Katta ekranda yoʻq — u yerda yon menyu
export function BottomNav() {
  const hasPermission = useHasPermission()
  const { pathname } = useLocation()
  const hidden = useDockHidden()
  const [moreOpen, setMoreOpen] = useState(false)

  const items = dockItems(hasPermission)
  const active = activePath(pathname, items)
  const activeIndex = items.findIndex((item) => item.path === active)
  // Faol boʻlim dokda boʻlmasa (masalan, Xarajatlar) — «Yana» yoritiladi
  const moreActive = activeIndex === -1

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-3 z-30 flex items-center justify-center gap-2.5 transition-[transform,opacity] duration-300 md:hidden',
          'bottom-[max(0.75rem,env(safe-area-inset-bottom))]',
          hidden && 'pointer-events-none translate-y-24 opacity-0',
        )}
      >
        <nav
          aria-label={DOCK_UI.more}
          className="glass flex h-[72px] grow items-center rounded-full p-[7px]"
        >
          {/* Linza: faol tab kengligida, transform bilan suzadi */}
          {activeIndex >= 0 && (
            <span
              aria-hidden="true"
              className="ease-spring absolute top-[7px] left-[7px] h-14 rounded-full bg-(--glass-lens) shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_4px_12px_-6px_rgba(20,30,60,.3)] transition-transform duration-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
              style={{
                width: `calc((100% - 14px) / ${items.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          )}
          {items.map((item, index) => {
            const on = index === activeIndex
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'relative z-10 flex h-14 flex-1 flex-col items-center justify-center gap-1.5 rounded-full text-[11px] leading-none font-medium transition-[transform,color] active:scale-95',
                  on ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className={cn('size-[22px]', on && 'stroke-[2.4]')} aria-hidden="true" />
                <span className="whitespace-nowrap">{DOCK_UI.short[item.path] ?? item.label}</span>
                {item.path === '/queue' && <QueueBadge />}
              </Link>
            )
          })}
        </nav>

        <button
          type="button"
          aria-label={DOCK_UI.more}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
          className={cn(
            'glass relative flex size-[72px] shrink-0 items-center justify-center rounded-full transition-transform active:scale-95',
            moreActive ? 'text-primary' : 'text-foreground',
          )}
        >
          <EllipsisIcon className="size-[22px]" aria-hidden="true" />
          {hasPermission(['feedback.read', 'feedback.own']) && <FeedbackDot />}
        </button>
      </div>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  )
}
