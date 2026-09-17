import { UI_TEXT } from '@e-dentist/shared'
import { useEffect, useState } from 'react'

/// Tish belgisi — Tabler Icons `dental` (MIT). lucide da tish yoʻq,
/// bitta belgi uchun paket qoʻshilmadi
function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5.5c-1.074-.586-2.583-1.5-4-1.5-2.1 0-4 1.247-4 5 0 4.899 1.056 8.41 2.671 10.537.573.756 1.97.521 2.4-.327l1.06-2.086a1.05 1.05 0 0 1 1.738 0l1.06 2.086c.43.848 1.827 1.083 2.4.327 1.615-2.127 2.671-5.638 2.671-10.537 0-3.753-1.9-5-4-5-1.417 0-2.926.914-4 1.5z" />
      <path d="M12 5.5l3 1.5" />
    </svg>
  )
}

/// Splash faqat kutish sezilarli boʻlsa chiqadi. Sessiya 100 ms da kelsa
/// ekranda bir lahza miltillagan tish qoladi — bundan koʻra boʻsh fon yaxshi
const SHOW_AFTER_MS = 200

interface SplashProps {
  /// Sinovda va hikoyalarda kechikishsiz koʻrsatish uchun
  immediate?: boolean
}

/// Yuklanish ekrani: koʻk tish suzadi, ostida soyasi, nom, uch nuqta.
/// Butun oynani egallaydi — sessiya kelguncha kabinet oʻrnida turadi
export function Splash({ immediate = false }: SplashProps) {
  const [visible, setVisible] = useState(immediate)

  useEffect(() => {
    if (immediate) return
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [immediate])

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background flex min-h-dvh items-center justify-center p-6"
    >
      <span className="sr-only">{UI_TEXT.loading}</span>
      {visible && (
        <div className="flex flex-col items-center">
          <ToothIcon className="text-primary animate-float size-14" />
          <div className="bg-border animate-float-shadow mt-1.5 h-1.5 w-9 rounded-full" />
          <div className="mt-3.5 text-lg font-semibold tracking-tight">{UI_TEXT.brand}</div>
          <div className="mt-3.5 flex gap-1.5">
            <span className="bg-primary animate-dot size-1.5 rounded-full" />
            <span className="bg-primary animate-dot size-1.5 rounded-full [animation-delay:180ms]" />
            <span className="bg-primary animate-dot size-1.5 rounded-full [animation-delay:360ms]" />
          </div>
        </div>
      )}
    </div>
  )
}
