import { APPOINTMENT_STATUS_LABELS, SCHEDULE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { CheckIcon, ClockIcon, UserCheckIcon, UserXIcon, XIcon } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'
import { type AppointmentActions, AppointmentMenu } from './AppointmentMenu'
import { pad, timeOf } from './scheduleUtils'

/// Holat koʻrinishi: toʻliq rangli yumshoq fon (chap hoshiya emas — uzoqdan
/// rang maydoni tezroq oʻqiladi) va shu holatning belgisi
const LOOK: Record<AppointmentStatus, { box: string; tone: string; icon: typeof ClockIcon }> = {
  scheduled: { box: 'bg-primary/10 hover:bg-primary/16', tone: 'text-primary', icon: ClockIcon },
  arrived: { box: 'bg-ok/15 hover:bg-ok/22', tone: 'text-ok', icon: UserCheckIcon },
  done: {
    box: 'bg-muted hover:bg-muted/70 text-muted-foreground',
    tone: 'text-muted-foreground',
    icon: CheckIcon,
  },
  no_show: { box: 'bg-warn/15 hover:bg-warn/22', tone: 'text-warn', icon: UserXIcon },
  cancelled: {
    box: 'bg-destructive/10 hover:bg-destructive/16 text-muted-foreground line-through',
    tone: 'text-destructive',
    icon: XIcon,
  },
}

/// Tugash vaqti — boshlanish + davomiylik
function endOf(item: Appointment): string {
  const end = new Date(new Date(item.at).getTime() + item.duration * 60_000)
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`
}

/// Vaqt toʻridagi qabul. Blok balandligi davomiylikdan kelib chiqadi, shuning
/// uchun mazmuni uch qavat: uzunda — oraliq, holat yorligʻi, ism, izoh;
/// oʻrtachada — vaqt va ism; qisqada bitta qator
export function AppointmentBlock({
  item,
  actions,
  style,
  canDrag,
  dragging,
  menuOpen,
  onMenuChange,
  onDragStart,
  wasTap,
}: {
  item: Appointment
  actions: AppointmentActions
  style: React.CSSProperties
  canDrag: boolean
  dragging: boolean
  menuOpen: boolean
  onMenuChange: (open: boolean) => void
  /// Sudrash boshlanishi — sichqoncha yoki barmoq
  onDragStart: (x: number, y: number, kind: 'mouse' | 'touch', touchId: number | null) => void
  /// Sudralmasdan qoʻyib yuborildimi — shunda menyu ochiladi
  wasTap: () => boolean
}) {
  const look = LOOK[item.status]
  const Icon = look.icon
  // 45 daqiqadan uzun — uch qator sigʻadi; 25 dan qisqa — bitta
  const tall = item.duration >= 45
  const short = item.duration < 25
  const time = timeOf(item.at)

  return (
    <AppointmentMenu item={item} actions={actions} open={menuOpen} onOpenChange={onMenuChange}>
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
          else onMenuChange(true)
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse' || !canDrag) return
          if (wasTap()) onMenuChange(true)
        }}
        onTouchStart={(event) => {
          event.stopPropagation()
          const touch = event.touches[0]
          if (!touch) return
          if (canDrag) onDragStart(touch.clientX, touch.clientY, 'touch', touch.identifier)
        }}
        onTouchEnd={() => {
          if (!canDrag || wasTap()) onMenuChange(true)
        }}
        title={canDrag ? SCHEDULE_UI.drag_hint : undefined}
        style={style}
        className={cn(
          'absolute overflow-hidden rounded-md px-1.5 text-left transition-colors',
          short ? 'flex items-center gap-1 py-0' : 'py-1',
          look.box,
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
            {tall && <span className="@max-[150px]:hidden"> – {endOf(item)}</span>}
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
    </AppointmentMenu>
  )
}
