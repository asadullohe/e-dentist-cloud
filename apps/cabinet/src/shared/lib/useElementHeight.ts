import { type RefObject, useLayoutEffect, useRef, useState } from 'react'

/// Elementning joriy balandligi (px) — oʻlchami oʻzgarganda yangilanadi.
/// Yopishqoq bloklar zanjirida keyingisining `top` i uchun
export function useElementHeight<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setHeight(el.offsetHeight)
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, height]
}
