import { SCHEDULE_UI, UI_TEXT } from '@e-dentist/shared'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type RefObject, useEffect, useRef, useState } from 'react'
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
import { AppointmentBlock } from './AppointmentBlock'
import {
  COLUMNS_TEMPLATE,
  type GridColumn,
  layoutDay,
  pad,
  splitByColumn,
  timeOf,
} from './scheduleUtils'
import { useBlockDrag } from './useBlockDrag'

/// Toʻr faqat ish soatlarini koʻrsatadi (oraliq tashqaridan — `hourRange`),
/// shuning uchun avtomatik surish kerak emas: sahifa tepasi ham koʻrinib
/// turadi. Bir soat — 96px: 30 daqiqalik blok (48px) uch qatorga, 15
/// daqiqalik (24px) bir qatorga sigʻadi
const HOUR = 96
/// Toʻr tepasidagi boʻsh joy: 00:00 yozuvi chiziq markazida — yarmi
/// kartochka chetidan chiqib kesilmasin
const TOP_PAD = 8
/// Vaqt oʻqi kengligi (2.75rem) — sudrashda ustunni hisoblash uchun
const GUTTER = 44

/// Sudrab boʻladigan qabul: rejalashtirilgan yoki kelgan; navbat yozuvi
/// (vaqti yoʻq), yakunlangan va bekor qilingan — yoʻq
const movable = (item: Appointment) =>
  !item.fromQueue && (item.status === 'scheduled' || item.status === 'arrived')

const localDateOf = (iso: string): string => {
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const minutesOf = (iso: string): number => {
  const date = new Date(iso)
  return date.getHours() * 60 + date.getMinutes()
}
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

/// Vaqt toʻri: chapda vaqt oʻqi, oʻngda ustunlar — kunlar (hafta) yoki
/// shifokorlar (kun). Boʻsh joy bosilsa — oʻsha vaqtga yangi qabul, blok
/// bosilsa — amallar menyusi, sudralsa — koʻchadi
export function TimeGrid({
  columns,
  startHour,
  endHour,
  today,
  appointments,
  blocks,
  loading,
  onOpen,
  onPickSlot,
  onEditBlock,
  onDeleteBlock,
  onMove,
  onShift,
  onScrollLeft,
  scrollRef,
}: {
  columns: readonly GridColumn[]
  /// Koʻrinadigan soatlar oraligʻi — ish vaqti, yozuvlar boʻyicha kengayadi
  startHour: number
  endHour: number
  today: string
  appointments: readonly Appointment[]
  blocks: readonly TimeBlock[]
  loading: boolean
  /// Kartochka bosilganda tafsilot oynasi
  onOpen: (item: Appointment) => void
  onPickSlot: (column: GridColumn, time: string) => void
  onEditBlock: (block: TimeBlock) => void
  onDeleteBlock: (block: TimeBlock) => void
  /// Blok sudrab qoʻyildi — yangi ustun va vaqt (`schedule.write` boʻlmasa berilmaydi)
  onMove?: (item: Appointment, column: GridColumn, time: string) => void
  /// Sudrashda chetda ushlab turilsa — davr almashadi
  onShift?: (by: -1 | 1) => void
  /// Toʻr yonga surilganda sarlavha tasmasi ham surilsin
  onScrollLeft?: (left: number) => void
  /// Tasmadan surish uchun — toʻrning gorizontal idishi
  scrollRef?: RefObject<HTMLDivElement | null>
}) {
  const nowMinutes = useNowMinutes()
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const topOf = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR
  const grid = useRef<HTMLDivElement>(null)
  const columnsRef = useRef<HTMLDivElement>(null)
  // Kunlar rejimida ustun — bir kun: blok ichida shifokor nomi ortiqcha
  const byDoctor = columns.some((column) => column.doctorId !== undefined)
  const justDropped = useRef(false)
  const { drag, begin, wasTap, cancel } = useBlockDrag({
    gridRef: columnsRef,
    columnCount: columns.length,
    geometry: { gutter: GUTTER, hour: HOUR, topPad: TOP_PAD, startHour, endHour },
    onDrop: (item, columnIndex, minutes) => {
      // Qoʻyib yuborilgach keladigan click ustunga «yangi qabul» ochmasin
      justDropped.current = true
      window.setTimeout(() => {
        justDropped.current = false
      }, 0)
      const column = columns[columnIndex]
      const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
      if (!column) return
      const sameSlot = column.date === localDateOf(item.at) && time === timeOf(item.at)
      const sameDoctor = column.doctorId === undefined || column.doctorId === item.doctorId
      if (sameSlot && sameDoctor) return
      onMove?.(item, column, time)
    },
    onEdgeShift: onShift,
  })

  // Escape — sudrashni bekor qilish
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cancel])

  function pickAt(column: GridColumn, event: React.MouseEvent<HTMLDivElement>) {
    // Blok menyusi (portal) React daraxti boʻyicha ustun ichida — uning
    // bandlari bosilganda ham shu yerga keladi; DOM boʻyicha tashqarida
    if (!event.currentTarget.contains(event.target as Node)) return
    if (justDropped.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const minutes = startHour * 60 + ((event.clientY - rect.top) / HOUR) * 60
    // 15 daqiqaga yaxlitlab
    const rounded = Math.min(
      endHour * 60 - 15,
      Math.max(startHour * 60, Math.floor(minutes / 15) * 15),
    )
    onPickSlot(column, `${pad(Math.floor(rounded / 60))}:${pad(rounded % 60)}`)
  }

  const byColumn = splitByColumn(columns, appointments)

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {loading ? (
        <Skeleton className="m-3 h-80" />
      ) : (
        // Telefonda ustunlar sigʻmaydi — yonga aylantiriladi (vaqt oʻqi
        // yopishib turadi); kompyuterda ustunlar kenglikni boʻlib oladi
        <div
          ref={scrollRef ?? grid}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => onScrollLeft?.(event.currentTarget.scrollLeft)}
        >
          <div
            ref={columnsRef}
            className="grid"
            style={{
              gridTemplateColumns: COLUMNS_TEMPLATE(columns.length),
              paddingTop: TOP_PAD,
            }}
          >
            {/* Vaqt oʻqi */}
            <div
              className="bg-card sticky left-0 z-30 col-start-1"
              style={{ height: hours.length * HOUR, position: 'sticky' }}
            >
              <div className="relative h-full">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="text-muted-foreground absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums"
                    style={{ top: topOf(hour * 60) }}
                  >
                    {pad(hour)}:00
                  </div>
                ))}
                {/* Sudrashda nishon vaqti oʻqda — video kabi */}
                {drag && (
                  <div
                    className="bg-primary text-primary-foreground pointer-events-none absolute right-0.5 z-20 -translate-y-1/2 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{ top: topOf(drag.minutes) }}
                  >
                    {pad(Math.floor(drag.minutes / 60))}:{pad(drag.minutes % 60)}
                  </div>
                )}
              </div>
            </div>

            {columns.map((column, columnIndex) => (
              // Ustun boʻsh joyi bosilganda oʻsha vaqtga yangi qabul. Klaviatura
              // uchun sahifadagi «Qabul qoʻshish» tugmasi bor
              // biome-ignore lint/a11y/noStaticElementInteractions: sichqoncha bilan vaqt tanlash
              // biome-ignore lint/a11y/useKeyWithClickEvents: klaviatura yoʻli — «Qabul qoʻshish» tugmasi
              <div
                key={column.key}
                // Ustun — oʻlcham manbai: tor boʻlsa (haftada, telefonda) blok
                // ichidagi belgilar va vaqt oraligʻi yashiriladi
                className="@container relative cursor-pointer border-l"
                style={{ height: hours.length * HOUR }}
                onClick={(event) => pickAt(column, event)}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-border/70 absolute inset-x-0 border-t"
                    style={{ top: topOf(hour * 60) }}
                  />
                ))}
                {/* Shifokorning band vaqti — shtrixli, qabullar ostida. Shifokor
                    ustunida faqat oʻzi, kun ustunida — hammaniki */}
                {blocks.map((block) => {
                  if (column.doctorId !== undefined && block.doctorId !== column.doctorId)
                    return null
                  const range = blockMinutes(block, column.date)
                  if (!range) return null
                  const top = topOf(Math.max(range.start, startHour * 60))
                  const bottom = topOf(Math.min(range.end, endHour * 60))
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
                          {!byDoctor && columns.length === 1 && (
                            <span className="block truncate">{block.doctorName}</span>
                          )}
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
                {(byColumn[columnIndex] ?? []).length === 0 &&
                  !blocks.some(
                    (block) =>
                      (column.doctorId === undefined || block.doctorId === column.doctorId) &&
                      blockMinutes(block, column.date),
                  ) && (
                    <span className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/3 text-center text-xs">
                      {SCHEDULE_UI.empty_column}
                    </span>
                  )}
                {layoutDay(byColumn[columnIndex] ?? []).map(({ item, lane, lanes }) => {
                  const canDrag = Boolean(onMove) && movable(item)
                  return (
                    <AppointmentBlock
                      key={item.id}
                      item={item}
                      canDrag={canDrag}
                      dragging={drag?.item.id === item.id}
                      onOpen={() => onOpen(item)}
                      onDragStart={(x, y, kind, touchId) => begin(item, x, y, kind, touchId)}
                      wasTap={wasTap}
                      style={{
                        top: topOf(minutesOf(item.at)),
                        // Blok hech qachon oʻz oraligʻidan oshmaydi — keyingisini bosmasin
                        height: Math.max(14, (item.duration / 60) * HOUR - 2),
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 3px)`,
                      }}
                    />
                  )
                })}
                {/* Sudralayotgan blokning sharpasi — nishon ustunda, 15 daqiqaga yaxlitlab */}
                {drag && drag.columnIndex === columnIndex && (
                  <div
                    className="border-primary bg-primary text-primary-foreground pointer-events-none absolute inset-x-0.5 z-20 overflow-hidden rounded-md border px-1 py-0.5 text-[10px] leading-tight shadow-lg sm:text-[11px]"
                    style={{
                      top: topOf(drag.minutes),
                      height: Math.max(14, (drag.item.duration / 60) * HOUR - 2),
                    }}
                  >
                    <span className="block font-semibold tabular-nums">
                      {pad(Math.floor(drag.minutes / 60))}:{pad(drag.minutes % 60)}
                    </span>
                    <span className="block truncate">{drag.item.fio}</span>
                  </div>
                )}
                {column.date === today &&
                  nowMinutes >= startHour * 60 &&
                  nowMinutes <= endHour * 60 && (
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
