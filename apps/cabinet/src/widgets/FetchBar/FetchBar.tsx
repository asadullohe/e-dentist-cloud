import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

/// Sahifa tepasida ingichka yuklanish chizigʻi — har qanday soʻrov (birinchi
/// yuklanish, fondagi yangilanish, saqlash) davomida koʻrinadi. Skeletlar
/// faqat birinchi yuklanishda chiqadi; keshdan koʻrsatilib turgan sahifa
/// yangilanayotganini esa shu chiziq bildiradi.
///
/// 150 ms dan qisqa soʻrovda koʻrinmaydi — tez javobda «miltillamasin»
const SHOW_AFTER_MS = 150

export function FetchBar() {
  const active = useIsFetching() + useIsMutating() > 0
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div
        className={`bg-primary h-full w-1/3 rounded-r-full transition-opacity duration-200 ${
          visible ? 'animate-fetch-bar opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
