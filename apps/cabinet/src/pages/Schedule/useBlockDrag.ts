import { type RefObject, useEffect, useRef, useState } from 'react'
import type { Appointment } from '@/entities/appointment'

/// Blokni sudrab koʻchirish: sichqoncha — 6px siljiganda, barmoq — 300 ms
/// ushlab turilganda boshlanadi (oddiy aylantirish buzilmasin: barmoq vaqtidan
/// oldin siljisa — bu scroll). Sudrash paytida sahifa chetida oʻzi aylanadi,
/// haftada chetda ushlab turilsa keyingi/oldingi davrga oʻtadi (video kabi)
export interface DragState {
  item: Appointment
  /// Nishon ustuni va boshlanish daqiqasi (15 ga yaxlitlangan)
  columnIndex: number
  minutes: number
}

export interface DragGeometry {
  /// Vaqt oʻqi kengligi (px) va bir soat balandligi
  gutter: number
  hour: number
  topPad: number
  /// Toʻr boshlanadigan soat (0)
  startHour: number
  endHour: number
}

const HOLD_MS = 300
const MOVE_TOLERANCE = 8
const EDGE_PX = 28
const EDGE_HOLD_MS = 600
const SCROLL_EDGE = 90
const SCROLL_STEP = 10

const minutesOfIso = (iso: string) => {
  const date = new Date(iso)
  return date.getHours() * 60 + date.getMinutes()
}

export function useBlockDrag({
  gridRef,
  columnCount,
  geometry,
  onDrop,
  onEdgeShift,
}: {
  gridRef: RefObject<HTMLDivElement | null>
  columnCount: number
  geometry: DragGeometry
  onDrop: (item: Appointment, columnIndex: number, minutes: number) => void
  /// Chetda ushlab turilganda davr almashadi (hafta/kun)
  onEdgeShift?: (by: -1 | 1) => void
}) {
  const [drag, setDrag] = useState<DragState | null>(null)
  // Hodisa ishlovchilari renderga bogʻlanmasin — hammasi ref da
  const state = useRef<{
    item: Appointment
    grabOffset: number
    pointer: { x: number; y: number }
    dragging: boolean
    moved: boolean
    holdTimer: number | null
    edgeTimer: number | null
    edgeSide: -1 | 1 | 0
    raf: number | null
    touchId: number | null
    kind: 'mouse' | 'touch'
  } | null>(null)
  const geo = useRef(geometry)
  geo.current = geometry
  const callbacks = useRef({ onDrop, onEdgeShift, columnCount })
  callbacks.current = { onDrop, onEdgeShift, columnCount }

  /// Barmoq/sichqoncha joyidan nishon (ustun, daqiqa)
  function targetAt(x: number, y: number): { columnIndex: number; minutes: number } | null {
    const grid = gridRef.current
    const s = state.current
    if (!grid || !s) return null
    const { gutter, hour, topPad, startHour, endHour } = geo.current
    const rect = grid.getBoundingClientRect()
    const colWidth = (rect.width - gutter) / callbacks.current.columnCount
    const columnIndex = Math.min(
      callbacks.current.columnCount - 1,
      Math.max(0, Math.floor((x - rect.left - gutter) / colWidth)),
    )
    const raw = ((y - rect.top - topPad) / hour) * 60 + startHour * 60 - s.grabOffset
    const snapped = Math.round(raw / 15) * 15
    const minutes = Math.min(endHour * 60 - s.item.duration, Math.max(startHour * 60, snapped))
    return { columnIndex, minutes }
  }

  function update() {
    const s = state.current
    if (!s?.dragging) return
    const target = targetAt(s.pointer.x, s.pointer.y)
    if (target) setDrag({ item: s.item, ...target })
  }

  /// Sahifa cheti — aylantirish; toʻr cheti — davr almashtirish
  function tick() {
    const s = state.current
    if (!s?.dragging) return
    const { y, x } = s.pointer
    if (y < SCROLL_EDGE) window.scrollBy(0, -SCROLL_STEP)
    else if (y > window.innerHeight - SCROLL_EDGE - 40) window.scrollBy(0, SCROLL_STEP)
    const rect = gridRef.current?.getBoundingClientRect()
    const side: -1 | 1 | 0 = rect
      ? x > rect.right - EDGE_PX
        ? 1
        : x < rect.left + geo.current.gutter + EDGE_PX / 2
          ? -1
          : 0
      : 0
    if (side !== s.edgeSide) {
      s.edgeSide = side
      if (s.edgeTimer) window.clearTimeout(s.edgeTimer)
      s.edgeTimer =
        side === 0
          ? null
          : window.setTimeout(() => {
              callbacks.current.onEdgeShift?.(side)
              s.edgeSide = 0
            }, EDGE_HOLD_MS)
    }
    update()
    s.raf = window.requestAnimationFrame(tick)
  }

  function start() {
    const s = state.current
    if (!s) return
    s.dragging = true
    document.body.style.userSelect = 'none'
    update()
    s.raf = window.requestAnimationFrame(tick)
  }

  function finish(commit: boolean) {
    const s = state.current
    if (!s) return
    if (s.holdTimer) window.clearTimeout(s.holdTimer)
    if (s.edgeTimer) window.clearTimeout(s.edgeTimer)
    if (s.raf) window.cancelAnimationFrame(s.raf)
    document.body.style.userSelect = ''
    const target = s.dragging ? targetAt(s.pointer.x, s.pointer.y) : null
    const item = s.item
    const wasDragging = s.dragging
    state.current = null
    setDrag(null)
    if (commit && wasDragging && target)
      callbacks.current.onDrop(item, target.columnIndex, target.minutes)
  }

  /// Blokka ulanadigan boshlanish: sichqoncha — pointerdown, barmoq — touchstart
  function begin(
    item: Appointment,
    x: number,
    y: number,
    kind: 'mouse' | 'touch',
    touchId: number | null,
  ) {
    const grid = gridRef.current
    if (!grid) return
    const { hour, topPad, startHour } = geo.current
    const rect = grid.getBoundingClientRect()
    const pointerMinutes = ((y - rect.top - topPad) / hour) * 60 + startHour * 60
    state.current = {
      item,
      grabOffset: pointerMinutes - minutesOfIso(item.at),
      pointer: { x, y },
      dragging: false,
      moved: false,
      holdTimer: null,
      edgeTimer: null,
      edgeSide: 0,
      raf: null,
      touchId,
      kind,
    }
    if (kind === 'touch') state.current.holdTimer = window.setTimeout(start, HOLD_MS)
  }

  // Hujjat darajasidagi hodisalar: sudrash blokdan tashqariga chiqsa ham davom etsin
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const s = state.current
      if (s?.kind !== 'mouse') return
      const dx = event.clientX - s.pointer.x
      const dy = event.clientY - s.pointer.y
      s.pointer = { x: event.clientX, y: event.clientY }
      if (!s.dragging && Math.hypot(dx, dy) > 6) {
        s.moved = true
        start()
      }
    }
    const onPointerUp = () => {
      const s = state.current
      if (s?.kind !== 'mouse') return
      finish(true)
    }
    const onTouchMove = (event: TouchEvent) => {
      const s = state.current
      if (s?.kind !== 'touch') return
      const touch = [...event.touches].find((t) => t.identifier === s.touchId) ?? event.touches[0]
      if (!touch) return
      const dx = touch.clientX - s.pointer.x
      const dy = touch.clientY - s.pointer.y
      if (!s.dragging) {
        // Ushlab turmasdan siljidi — bu aylantirish, sudrash emas
        if (Math.hypot(dx, dy) > MOVE_TOLERANCE) finish(false)
        return
      }
      // Sudrash boshlangan — sahifa aylanmasin (passiv emas)
      event.preventDefault()
      s.pointer = { x: touch.clientX, y: touch.clientY }
    }
    const onTouchEnd = () => {
      const s = state.current
      if (s?.kind !== 'touch') return
      finish(true)
    }
    const onCancel = () => finish(false)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onCancel)
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  })

  /// Blok bosilib, sudralmasdan qoʻyib yuborildimi — menyu ochish uchun
  function wasTap(): boolean {
    const s = state.current
    return s !== null && !s.dragging && !s.moved
  }

  return { drag, begin, wasTap, cancel: () => finish(false) }
}
