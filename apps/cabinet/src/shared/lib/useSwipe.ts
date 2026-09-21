import { useRef } from 'react'

/// Gorizontal surish: chapga — keyingi, oʻngga — oldingi. Vertikal
/// aylantirish bilan chalkashmasin: dy dx dan katta boʻlsa surish emas.
/// Barmoq — touch hodisalari (aylantirish boshlansa ham touchend keladi);
/// sichqoncha — pointer hodisalari, surishdan keyingi click yutiladi (boʻsh
/// katak bosilgandek yangi qabul ochilmasin). Natija — elementga tarqatiladi
export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 56) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swallowClick = useRef(false)

  function finish(x: number, y: number): boolean {
    const from = start.current
    start.current = null
    if (!from) return false
    const dx = x - from.x
    const dy = y - from.y
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return false
    if (dx < 0) onLeft()
    else onRight()
    return true
  }

  return {
    onTouchStart(event: React.TouchEvent) {
      const touch = event.touches[0]
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd(event: React.TouchEvent) {
      const touch = event.changedTouches[0]
      if (touch) finish(touch.clientX, touch.clientY)
    },
    onPointerDown(event: React.PointerEvent) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      start.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp(event: React.PointerEvent) {
      if (event.pointerType !== 'mouse') return
      swallowClick.current = finish(event.clientX, event.clientY)
    },
    onClickCapture(event: React.MouseEvent) {
      if (!swallowClick.current) return
      swallowClick.current = false
      event.stopPropagation()
      event.preventDefault()
    },
  }
}
