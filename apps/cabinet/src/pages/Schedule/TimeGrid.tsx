import { SCHEDULE_UI, WEEKDAYS } from '@e-dentist/shared'
import { cn } from 'cn'
import { useEffect, useRef, useState } from 'react'
import type { Appointment } from '@/entities/appointment'
import { Card, Skeleton } from '@/shared/ui'
import { type AppointmentActions, AppointmentMenu } from './AppointmentMenu'
import { blockClass, layoutDay, mondayFirst, pad, parseIso, timeOf } from './scheduleUtils'

/// Ish kuni 08:00–20:00; bir soat — 56px (telefonda 30 daqiqalik blokka
/// ism sigʻadi). Keyinroq klinika sozlamasi
const START = 8
const END = 20
const HOUR = 56
const HOURS = Array.from({ length: END - START }, (_, i) => START + i)

const minutesOf = (iso: string): number => {
  const date = new Date(iso)
  return date.getHours() * 60 + date.getMinutes()
}
const topOf = (minutes: number) => ((minutes - START * 60) / 60) * HOUR

const nowMinutesOf = () => new Date().getHours() * 60 + new Date().getMinutes()

/// Hozirgi vaqt chizigʻi — daqiqada bir yangilanadi
function useNowMinutes(): number {
  const [minutes, setMinutes] = useState(nowMinutesOf)
  useEffect(() => {
    const timer = setInterval(() => setMinutes(nowMinutesOf()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return minutes
}

/// Kun/hafta koʻrinishi: vaqt oʻqi, har kun uchun ustun, qabul bloklari
/// davomiyligiga qarab. Boʻsh joy bosilsa — oʻsha vaqtga yangi qabul,
/// blok bosilsa — amallar menyusi
export function TimeGrid({
  days,
  today,
  byDay,
  loading,
  actions,
  onPickSlot,
}: {
  /// 1 (kun) yoki 7 (hafta) ta ISO sana
  days: readonly string[]
  today: string
  byDay: Map<string, Appointment[]>
  loading: boolean
  actions: AppointmentActions
  onPickSlot: (date: string, time: string) => void
}) {
  const nowMinutes = useNowMinutes()
  const scroller = useRef<HTMLDivElement>(null)
  const week = days.length > 1

  // Ochilganda ish boshiga emas, hozirgi vaqtdan biroz tepaga (faqat
  // kun/hafta almashganda — daqiqa sayin aylantirmaymiz)
  useEffect(() => {
    const el = scroller.current
    if (!el || !days.includes(today)) return
    el.scrollTop = Math.max(0, topOf(nowMinutesOf()) - HOUR * 2)
  }, [days, today])

  function pickAt(day: string, event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const minutes = START * 60 + ((event.clientY - rect.top) / HOUR) * 60
    // 15 daqiqaga yaxlitlab
    const rounded = Math.min(END * 60 - 15, Math.max(START * 60, Math.floor(minutes / 15) * 15))
    onPickSlot(day, `${pad(Math.floor(rounded / 60))}:${pad(rounded % 60)}`)
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {/* Kun sarlavhalari — haftada; bir kunda kerak emas */}
      {week && (
        <div className="grid grid-cols-[2.75rem_repeat(7,1fr)] border-b">
          <div />
          {days.map((day) => {
            const date = parseIso(day)
            const isToday = day === today
            return (
              <div key={day} className="flex flex-col items-center gap-0.5 py-1.5">
                <span className="text-muted-foreground text-[11px]">
                  {WEEKDAYS[mondayFirst(date)]}
                </span>
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <Skeleton className="m-3 h-80" />
      ) : (
        <div ref={scroller} className="max-h-[calc(100dvh-18rem)] overflow-y-auto">
          <div
            className="grid"
            style={{ gridTemplateColumns: `2.75rem repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {/* Vaqt oʻqi */}
            <div className="relative" style={{ height: HOURS.length * HOUR }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-muted-foreground absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums"
                  style={{ top: topOf(hour * 60) }}
                >
                  {pad(hour)}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              // Ustun boʻsh joyi bosilganda oʻsha vaqtga yangi qabul. Klaviatura
              // uchun sahifadagi «Qabul qoʻshish» tugmasi bor
              // biome-ignore lint/a11y/noStaticElementInteractions: sichqoncha bilan vaqt tanlash
              // biome-ignore lint/a11y/useKeyWithClickEvents: klaviatura yoʻli — «Qabul qoʻshish» tugmasi
              <div
                key={day}
                className="relative cursor-pointer border-l"
                style={{ height: HOURS.length * HOUR }}
                onClick={(event) => pickAt(day, event)}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-border/70 absolute inset-x-0 border-t"
                    style={{ top: topOf(hour * 60) }}
                  />
                ))}
                {layoutDay(byDay.get(day) ?? []).map(({ item, lane, lanes }) => {
                  const start = minutesOf(item.at)
                  return (
                    <AppointmentMenu key={item.id} item={item} actions={actions}>
                      <button
                        type="button"
                        onClick={(event) => event.stopPropagation()}
                        className={cn(
                          'absolute overflow-hidden rounded-md border-l-[3px] px-1 py-0.5 text-left text-[10px] leading-tight sm:text-[11px]',
                          blockClass(item.status),
                          // Navbat yozuvi: vaqti — kelgan lahza, davomiyligi yoʻq
                          item.fromQueue && 'border-dashed border',
                        )}
                        style={{
                          top: topOf(start),
                          height: Math.max(18, (item.duration / 60) * HOUR - 2),
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 3px)`,
                        }}
                      >
                        <span className="block font-semibold tabular-nums">{timeOf(item.at)}</span>
                        <span className="block truncate">{item.fio}</span>
                      </button>
                    </AppointmentMenu>
                  )
                })}
                {day === today && nowMinutes >= START * 60 && nowMinutes <= END * 60 && (
                  <div
                    className="bg-destructive pointer-events-none absolute inset-x-0 z-10 h-0.5"
                    style={{ top: topOf(nowMinutes) }}
                    title={SCHEDULE_UI.now}
                  >
                    <span className="bg-destructive absolute -top-[3px] -left-1 size-2 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
