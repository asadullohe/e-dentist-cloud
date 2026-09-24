import { APPOINTMENT_STATUS_LABELS, SCHEDULE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { CheckIcon, ClockIcon, UserCheckIcon, UserXIcon, XIcon } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { endTimeOf, statusTone, timeOf } from './scheduleUtils'

/// Har holatning belgisi; ranglari `statusTone` da — qabul oynasi bilan bitta
const ICONS: Record<AppointmentStatus, typeof ClockIcon> = {
  scheduled: ClockIcon,
  arrived: UserCheckIcon,
  done: CheckIcon,
  no_show: UserXIcon,
  cancelled: XIcon,
}

/// Vaqt toʻridagi qabul. Blok balandligi davomiylikdan kelib chiqadi, shuning
/// uchun mazmuni uch qavat: uzunda — oraliq, holat yorligʻi, ism, izoh;
/// oʻrtachada — vaqt va ism; qisqada bitta qator
export function AppointmentBlock({
  item,
  style,
  canDrag,
  dragging,
  onOpen,
  onDragStart,
  wasTap,
}: {
  item: Appointment
  style: React.CSSProperties
  canDrag: boolean
  dragging: boolean
  /// Bosilganda tafsilot oynasi ochiladi (sudralganda emas)
  onOpen: () => void
  /// Sudrash boshlanishi — sichqoncha yoki barmoq
  onDragStart: (x: number, y: number, kind: 'mouse' | 'touch', touchId: number | null) => void
  /// Sudralmasdan qoʻyib yuborildimi — shunda menyu ochiladi
  wasTap: () => boolean
}) {
  const look = statusTone(item.status)
  const Icon = ICONS[item.status]
  // 45 daqiqadan uzun — uch qator sigʻadi; 25 dan qisqa — bitta
  const tall = item.duration >= 45
  const short = item.duration < 25
  const time = timeOf(item.at)

  return (
    <button
      type="button"
      onClick={(event) => event.stopPropagation()}
      // Radix menyuni pointerdown da ochadi — biz oʻzimiz boshqaramiz:
      // sudralmasdan qoʻyib yuborilsa ochiladi. Boshlanish hodisasi yuqoriga
      // chiqmaydi — hafta surish (useSwipe) boshlanmasin; tugashi hujjatgacha
      // boradi, hook u yerda tinglaydi
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        if (canDrag) onDragStart(event.clientX, event.clientY, 'mouse', null)
        else onOpen()
      }}
      onPointerUp={(event) => {
        if (event.pointerType !== 'mouse' || !canDrag) return
        if (wasTap()) onOpen()
      }}
      onTouchStart={(event) => {
        event.stopPropagation()
        const touch = event.touches[0]
        if (!touch) return
        if (canDrag) onDragStart(touch.clientX, touch.clientY, 'touch', touch.identifier)
      }}
      onTouchEnd={() => {
        if (!canDrag || wasTap()) onOpen()
      }}
      title={canDrag ? SCHEDULE_UI.drag_hint : undefined}
      style={style}
      className={cn(
        'absolute overflow-hidden rounded-md px-1.5 text-left transition-colors',
        short ? 'flex items-center gap-1 py-0' : 'py-1',
        look.fill,
        // Navbatdan kelgan yozuv: vaqti — kelgan lahza, davomiyligi yoʻq
        item.fromQueue && 'border border-dashed border-current/40',
        canDrag && 'touch-pan-y cursor-grab active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      {/* Tor ustunda (haftada) vaqt oraligʻi qatorni ikkiga boʻlib
            yubormasin — kesilib qolgani maʼqul */}
      <span
        className={cn(
          'flex items-center gap-1 overflow-hidden whitespace-nowrap',
          !short && 'w-full',
        )}
      >
        <Icon
          className={cn('shrink-0 @max-[104px]:hidden', short ? 'size-2.5' : 'size-3', look.tone)}
        />
        <span className="text-[11px] font-medium tabular-nums">
          {time}
          {tall && <span className="@max-[150px]:hidden"> – {endTimeOf(item)}</span>}
        </span>
        {tall && item.status !== 'scheduled' && (
          <span className={cn('ml-auto truncate text-[10px] font-medium', look.tone)}>
            {APPOINTMENT_STATUS_LABELS[item.status]}
          </span>
        )}
        {!tall && <span className="truncate text-[11px] font-semibold">{item.fio}</span>}
      </span>
      {tall && <span className="block truncate text-xs font-semibold">{item.fio}</span>}
      {!short && item.note && (
        <span className="block truncate text-[11px] opacity-70">{item.note}</span>
      )}
    </button>
  )
}
