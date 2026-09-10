// Tungi rejim.
//
// Tanlov brauzerda saqlanadi; birinchi ochilishda tizim sozlamasi olinadi.
// `localStorage` yopiq boʻlishi mumkin (maxfiy oyna), shuning uchun har
// murojaat himoyalangan — panel baribir ochilishi kerak.

import { useEffect, useState } from 'react'

const KEY = 'edentist-panel-theme'

export type Theme = 'light' | 'dark'

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // maxfiy oyna yoki saqlash oʻchirilgan
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(read)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // saqlanmasa ham joriy sessiyada ishlaydi
    }
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
