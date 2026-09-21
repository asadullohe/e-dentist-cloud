import { formatDate, formatMoney, moneyDigits, PAYMENT_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import type { Visit } from '@/entities/visit'
import { Checkbox, Input, Label } from '@/shared/ui'

/// Tanlangan ishlar: id → summa (maskalangan matn)
export type Picked = Map<string, string>

/// Yopilmagan ishlar — eng eskisidan
export function openWorks(visits: readonly Visit[]): Visit[] {
  return visits
    .filter((visit) => visit.price - visit.paid > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
}

export const pickedTotal = (picked: Picked) =>
  [...picked.values()].reduce((acc, value) => acc + Number(moneyDigits(value) || 0), 0)

/// «Qaysi ish uchun»: yopilmagan ishlar roʻyxati. Belgilanganida qolgan
/// summasi bilan qoʻshiladi; qisman toʻlov — yonidagi summa kamaytiriladi
export function WorksPicker({
  works,
  picked,
  onChange,
}: {
  works: readonly Visit[]
  picked: Picked
  onChange: (next: Picked) => void
}) {
  function toggle(visit: Visit, on: boolean) {
    const next = new Map(picked)
    if (on) next.set(visit.id, formatMoney(String(visit.price - visit.paid)))
    else next.delete(visit.id)
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <Label>{PAYMENT_UI.for_works}</Label>
      {works.length === 0 ? (
        <p className="text-muted-foreground text-xs">{PAYMENT_UI.for_works_none}</p>
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {works.map((visit) => {
              const on = picked.has(visit.id)
              const remaining = visit.price - visit.paid
              return (
                <li
                  key={visit.id}
                  className={cn('flex items-center gap-2.5 px-2.5 py-2', on && 'bg-primary/5')}
                >
                  <Checkbox
                    id={`work-${visit.id}`}
                    checked={on}
                    onCheckedChange={(state) => toggle(visit, state === true)}
                  />
                  <label htmlFor={`work-${visit.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-sm">
                      {visit.treatment}
                      {visit.tooth !== null && (
                        <span className="text-muted-foreground"> · {visit.tooth}</span>
                      )}
                    </span>
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {formatDate(visit.date.slice(0, 10))}
                      {visit.paid > 0 &&
                        ` · ${PAYMENT_UI.remaining_of(formatMoney(String(remaining)))}`}
                    </span>
                  </label>
                  {on ? (
                    <Input
                      inputMode="numeric"
                      aria-label={visit.treatment}
                      value={picked.get(visit.id) ?? ''}
                      onChange={(event) => {
                        const next = new Map(picked)
                        next.set(visit.id, formatMoney(event.target.value))
                        onChange(next)
                      }}
                      className="h-8 w-28 text-right tabular-nums"
                    />
                  ) : (
                    <span className="w-28 text-right text-sm font-medium tabular-nums">
                      {formatMoney(String(remaining))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="text-muted-foreground text-xs">
            {picked.size > 0 ? PAYMENT_UI.for_works_hint : PAYMENT_UI.for_works_auto}
          </p>
        </>
      )}
    </div>
  )
}
