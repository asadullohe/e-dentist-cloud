import { useEffect, useState } from 'react'

/// Dok klaviatura ochilganda (matn maydoni fokusda) yashirinadi — ekran tor,
/// forma ustini yopmasin. Boshqa paytda doim bir xil turadi: aylantirishda
/// kichrayish sinab koʻrildi va gʻalati tuyuldi (21/09/2026)
export function useDockHidden(): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const typing = (el: Element | null) =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el instanceof HTMLElement && el.isContentEditable)
    const onFocus = () => setHidden(typing(document.activeElement))
    // focusout dan keyin activeElement hali eskisi — keyingi tikda oʻqiladi
    const onBlur = () => setTimeout(onFocus, 0)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onBlur)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onBlur)
    }
  }, [])

  return hidden
}
