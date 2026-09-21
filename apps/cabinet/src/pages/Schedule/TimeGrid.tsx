import { SCHEDULE_UI, UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Appointment, TimeBlock } from '@/entities/appointment'
import { blockMinutes } from '@/features/appointment-form'
import {
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@/shared/ui'
import { type AppointmentActions, AppointmentMenu } from './AppointmentMenu'
import { blockClass, layoutDay, pad, timeOf } from './scheduleUtils'

/// Toʻr sutka boʻyi (tungi navbat, erta taʼtil ham koʻrinsin), ochilganda
/// ish boshi — 08:00 koʻrinadigan joyga suriladi. Bir soat — 72px: 15
/// daqiqalik blok (18px) bir qatorga, 30 daqiqalik (36px) ikki qatorga sigʻadi
const START = 0
const END = 24
const WORK_START = 8
const HOUR = 72
const HOURS = Array.from({ length: END - START }, (_, i) => START + i)
/// Toʻr tepasidagi boʻsh joy: 00:00 yozuvi chiziq markazida — yarmi
/// kartochka chetidan chiqib kesilmasin
const TOP_PAD = 8

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
  blocks,
  loading,
  actions,
  onPickSlot,
  onEditBlock,
  onDeleteBlock,
}: {
  /// 1 (kun) yoki 7 (hafta) ta ISO sana
  days: readonly string[]
  today: string
  byDay: Map<string, Appointment[]>
  blocks: readonly TimeBlock[]
  loading: boolean
  actions: AppointmentActions
  onPickSlot: (date: string, time: string) => void
  onEditBlock: (block: TimeBlock) => void
  onDeleteBlock: (block: TimeBlock) => void
}) {
  const nowMinutes = useNowMinutes()
  const grid = useRef<HTMLDivElement>(null)
  const week = days.length > 1

  // Ichki scroll yoʻq — sahifa oʻzi aylanadi (telefonda ikki scroll chalkash).
  // Faqat birinchi ochilganda (Schedule `key={view}` bilan qayta ochadi)
  // ish boshi — 08:00 — yopishqoq sarlavha ostiga keladi. Kunni
  // almashtirganda oʻrin saqlanadi — sahifa sakramasin
  const positioned = useRef(false)
  useEffect(() => {
    const el = grid.current
    // Yuklanayotganda toʻr oʻrnida skelet — toʻr chizilgach bir marta
    if (loading || !el || positioned.current) return
    positioned.current = true
    // Yopishqoq blok ostidan boshlanadigan qilib. Blok hali yopishmagan
    // (sahifa tepada) — joyi emas, yopishadigan balandligi (top + height) olinadi
    const sticky = document.querySelector<HTMLElement>('[data-sticky="schedule"]')
    const stuckTop = sticky ? Number.parseFloat(getComputedStyle(sticky).top) || 0 : 56
    const offset = stuckTop + (sticky?.offsetHeight ?? 56) + 8
    const y =
      el.getBoundingClientRect().top + window.scrollY + TOP_PAD + topOf(WORK_START * 60) - offset
    window.scrollTo({ top: Math.max(0, y) })
  }, [loading])

  function pickAt(day: string, event: React.MouseEvent<HTMLDivElement>) {
    // Blok menyusi (portal) React daraxti boʻyicha ustun ichida — uning
    // bandlari bosilganda ham shu yerga keladi; DOM boʻyicha tashqarida
    if (!event.currentTarget.contains(event.target as Node)) return
    const rect = event.currentTarget.getBoundingClientRect()
    const minutes = START * 60 + ((event.clientY - rect.top) / HOUR) * 60
    // 15 daqiqaga yaxlitlab
    const rounded = Math.min(END * 60 - 15, Math.max(START * 60, Math.floor(minutes / 15) * 15))
    onPickSlot(day, `${pad(Math.floor(rounded / 60))}:${pad(rounded % 60)}`)
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {loading ? (
        <Skeleton className="m-3 h-80" />
      ) : (
        <div ref={grid}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `2.75rem repeat(${days.length}, minmax(0, 1fr))`,
              paddingTop: TOP_PAD,
            }}
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
                {/* Shifokorning band vaqti — shtrixli, qabullar ostida */}
                {blocks.map((block) => {
                  const range = blockMinutes(block, day)
                  if (!range) return null
                  const top = topOf(Math.max(range.start, START * 60))
                  const bottom = topOf(Math.min(range.end, END * 60))
                  if (bottom <= top) return null
                  return (
                    <DropdownMenu key={block.id}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(event) => event.stopPropagation()}
                          className="bg-muted-foreground/10 text-muted-foreground absolute inset-x-0.5 overflow-hidden rounded-md border border-dashed px-1 py-0.5 text-left text-[10px] leading-tight [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgba(100,116,139,.12)_6px_7px)] sm:text-[11px]"
                          style={{ top, height: bottom - top - 2 }}
                          title={block.reason ?? SCHEDULE_UI.block}
                        >
                          <span className="block truncate font-medium">
                            {block.reason || SCHEDULE_UI.block_default}
                          </span>
                          {!week && <span className="block truncate">{block.doctorName}</span>}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44">
                        <DropdownMenuItem onClick={() => onEditBlock(block)}>
                          <PencilIcon />
                          {UI_TEXT.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteBlock(block)}
                        >
                          <Trash2Icon />
                          {UI_TEXT.remove}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                })}
                {layoutDay(byDay.get(day) ?? []).map(({ item, lane, lanes }) => {
                  const start = minutesOf(item.at)
                  // Qisqa blok (≤ 15 daq) — vaqt va ism bir qatorda; balandlik
                  // hech qachon oʻz oraligʻidan oshmaydi — keyingisini bosmasin
                  const short = item.duration <= 15
                  return (
                    <AppointmentMenu key={item.id} item={item} actions={actions}>
                      <button
                        type="button"
                        onClick={(event) => event.stopPropagation()}
                        className={cn(
                          'absolute overflow-hidden rounded-md border-l-[3px] px-1 text-left text-[10px] sm:text-[11px]',
                          short ? 'flex items-center gap-1 leading-none' : 'py-0.5 leading-tight',
                          blockClass(item.status),
                          // Navbat yozuvi: vaqti — kelgan lahza, davomiyligi yoʻq
                          item.fromQueue && 'border-dashed border',
                        )}
                        style={{
                          top: topOf(start),
                          height: Math.max(12, (item.duration / 60) * HOUR - 2),
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 3px)`,
                        }}
                      >
                        <span className={cn('font-semibold tabular-nums', !short && 'block')}>
                          {timeOf(item.at)}
                        </span>
                        <span className={cn('truncate', !short && 'block')}>{item.fio}</span>
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
