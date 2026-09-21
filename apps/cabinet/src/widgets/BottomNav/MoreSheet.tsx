import { DOCK_UI, formatSom, UI_TEXT } from '@e-dentist/shared'
import { LogOutIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebtors } from '@/entities/debtor'
import { useFeedbackSummary } from '@/entities/feedback'
import { useLabOrders } from '@/entities/lab-order'
import { useHasPermission } from '@/entities/session'
import { LogoutDialog } from '@/features/auth'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui'
import { type DockItem, moreItems } from './dockItems'

/// Plitka ostidagi jonli izoh — faqat oʻsha boʻlim ruxsati bor xodimga
/// chiziladi, soʻrov ham shunda ketadi
function LabHint() {
  const { data } = useLabOrders({ status: 'ready' })
  return data && data.length > 0 ? DOCK_UI.lab_ready(data.length) : null
}
function DebtHint() {
  const { data } = useDebtors({ page: 1, pageSize: 1, sort: 'debt', dir: 'desc' })
  return data && data.totalDebt > 0 ? formatSom(data.totalDebt) : null
}
function FeedbackHint() {
  const { data } = useFeedbackSummary()
  return data && data.newCount > 0 ? DOCK_UI.feedback_new(data.newCount) : null
}
const HINTS: Record<string, () => string | null> = {
  '/lab': LabHint,
  '/debtors': DebtHint,
  '/settings/fikrlar': FeedbackHint,
}

/// Plitka balandligi (h-24) va oraliq (gap-2) — CSS bilan bir xil. Plitka
/// qatʼiy balandlikda: izohli va izohsizlari bir xil, panjara oʻlchami aniq
const TILE = 96
const GAP = 8
const COLS = 3
function gridHeight(count: number): number {
  const rows = Math.max(1, Math.ceil(count / COLS))
  return rows * TILE + (rows - 1) * GAP
}

/// «Yana» — pastdan chiqadigan shisha varaq: qidiruv, dokka sigʻmagan
/// boʻlimlar plitkalari (jonli izohlar bilan), hisob va chiqish
export function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const hasPermission = useHasPermission()
  const [query, setQuery] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)

  const items = moreItems(hasPermission)
  const q = query.trim().toLowerCase()
  const shown = q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) setQuery('')
          onOpenChange(next)
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="glass inset-x-0 bottom-0 gap-0 rounded-t-[28px] rounded-b-none border-x-0 border-b-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <SheetTitle className="sr-only">{DOCK_UI.more}</SheetTitle>
          <div className="bg-foreground/15 relative mx-auto mb-3 h-1 w-10 rounded-full" />

          <label className="bg-background/80 text-muted-foreground relative mb-3 flex h-10 items-center gap-2 rounded-xl border border-foreground/10 px-3 text-sm dark:border-white/10">
            <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={DOCK_UI.search}
              className="text-foreground placeholder:text-muted-foreground w-full bg-transparent outline-none"
            />
          </label>

          {/* Balandlik toʻliq roʻyxatdan hisoblanadi va qidiruvda oʻzgarmaydi —
              varaq sakramasin. Kichik ekranda ichida aylanadi */}
          <div
            className="relative max-h-[60dvh] overflow-y-auto"
            style={{ minHeight: gridHeight(items.length) }}
          >
            {shown.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">{DOCK_UI.nothing}</p>
            ) : (
              <div className="grid grid-cols-3 content-start gap-2">
                {shown.map((item) => (
                  <Tile key={item.path} item={item} onPick={() => onOpenChange(false)} />
                ))}
              </div>
            )}
          </div>

          {/* Xodim kartasi tepa panelda (profil menyusi) — bu yerda faqat chiqish */}
          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              setLogoutOpen(true)
            }}
            className="text-muted-foreground hover:text-foreground relative mt-3 flex w-full items-center gap-2 border-t border-foreground/10 pt-3 text-sm dark:border-white/10"
          >
            <LogOutIcon className="size-4" aria-hidden="true" />
            {UI_TEXT.logout}
          </button>
        </SheetContent>
      </Sheet>
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  )
}

function Tile({ item, onPick }: { item: DockItem; onPick: () => void }) {
  const Hint = HINTS[item.path]
  return (
    <Link
      to={item.path}
      onClick={onPick}
      className="bg-background/85 flex h-24 flex-col gap-1.5 rounded-2xl border border-foreground/10 p-2.5 shadow-[0_1px_2px_rgba(20,30,60,.06),0_6px_16px_-10px_rgba(20,30,60,.35)] transition-transform active:scale-95 dark:border-white/12 dark:bg-white/6 dark:shadow-none"
    >
      <span className="bg-primary/12 text-primary flex size-8 items-center justify-center rounded-lg">
        <item.icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-[13px] leading-tight font-semibold">{item.label}</span>
      {Hint && (
        <span className="text-muted-foreground text-[11px] leading-tight">
          <Hint />
        </span>
      )}
    </Link>
  )
}
