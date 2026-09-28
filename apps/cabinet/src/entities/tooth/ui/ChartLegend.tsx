import { STATUS_STYLE, TOOTH_STATUSES, toothStatusLabel } from '@e-dentist/teeth'
import type { ToothInfo } from '../model'

/// Rang belgisi: afsonada va tahrirlash panelida bir xil
export function StatusSwatch({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLE[status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.soglom
  return (
    <span
      className={className ?? 'inline-block size-2.5 shrink-0 rounded-[3px]'}
      style={{
        background: style.fill === 'none' ? 'transparent' : style.fill,
        border: `1.5px ${status === 'olingan' ? 'dashed' : 'solid'} ${style.stroke}`,
      }}
    />
  )
}

/// Faqat xaritada bor holatlar, sanogʻi bilan. Sogʻlom tish sanalmaydi —
/// ularsiz ham koʻrinib turibdi
export function ChartLegend({ teeth }: { teeth: readonly ToothInfo[] }) {
  const counts = new Map<string, number>()
  for (const tooth of teeth) {
    if (tooth.status === 'soglom') continue
    counts.set(tooth.status, (counts.get(tooth.status) ?? 0) + 1)
  }
  const shown = TOOTH_STATUSES.filter((status) => counts.has(status))
  if (shown.length === 0) return null

  return (
    <ul className="text-muted-foreground space-y-2 text-sm">
      {shown.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <StatusSwatch status={status} />
          {toothStatusLabel(status)}
          <span className="ml-auto tabular-nums">{counts.get(status)}</span>
        </li>
      ))}
    </ul>
  )
}
