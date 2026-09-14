import type { Locale } from '@e-dentist/shared'
import { cn } from 'cn'

interface FlagProps {
  locale: Locale
  className?: string
}

/// Til tanlovidagi bayroq. SVG, emoji emas: emoji bayroqlar Windows da
/// harf boʻlib chiqadi, hajmi ham shriftga qarab «sakraydi».
/// Bezak: yonida til nomi yoki kodi yoziladi, shuning uchun `aria-hidden`
export function Flag({ locale, className }: FlagProps) {
  const cls = cn('inline-block h-4 w-6 shrink-0 rounded-[2px]', className)

  if (locale === 'ru') {
    return (
      <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
        <rect width="24" height="16" fill="#fff" />
        <rect y="5.33" width="24" height="5.34" fill="#0039a6" />
        <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
      </svg>
    )
  }

  // Oʻzbekiston: koʻk · qizil chiziq · oq · qizil chiziq · yashil, yarim oy
  return (
    <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
      <rect width="24" height="16" fill="#0099b5" />
      <rect y="5.33" width="24" height="5.34" fill="#fff" />
      <rect y="5.33" width="24" height="0.6" fill="#ce1126" />
      <rect y="10.07" width="24" height="0.6" fill="#ce1126" />
      <rect y="10.67" width="24" height="5.33" fill="#1eb53a" />
      <circle cx="3.6" cy="2.9" r="1.9" fill="#fff" />
      <circle cx="4.3" cy="2.9" r="1.6" fill="#0099b5" />
    </svg>
  )
}
