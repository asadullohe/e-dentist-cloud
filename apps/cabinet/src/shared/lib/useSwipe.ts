import { useRef } from 'react'

/// Gorizontal surish: chapga — keyingi, oʻngga — oldingi. Vertikal
/// aylantirish bilan chalkashmasin: dy dx dan katta boʻlsa surish emas.
/// Natija — elementga tarqatiladigan touch hodisalari
export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 56) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart(event: React.TouchEvent) {
      const touch = event.touches[0]
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd(event: React.TouchEvent) {
      const from = start.current
      const touch = event.changedTouches[0]
      start.current = null
      if (!from || !touch) return
      const dx = touch.clientX - from.x
      const dy = touch.clientY - from.y
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return
      if (dx < 0) onLeft()
      else onRight()
    },
  }
}
