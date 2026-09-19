import { useSyncExternalStore } from 'react'

/// CSS media soʻrovi React holati sifatida: `useMediaQuery('(max-width: 767px)')`.
/// Oyna oʻlchami oʻzgarganda qayta render boʻladi; serverda/testda `false`
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    () => false,
  )
}
