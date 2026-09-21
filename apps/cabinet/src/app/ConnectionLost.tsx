import { UI_TEXT } from '@e-dentist/shared'
import { WifiOffIcon } from 'lucide-react'
import { useLayoutEffect } from 'react'
import { Button, hideStaticSplash } from '@/shared/ui'

/// Sessiyani tekshirib boʻlmadi — server javob bermadi. Kirmagan
/// foydalanuvchi bilan adashtirmaymiz: cookie joyida, qayta urinish yetadi
export function ConnectionLost({ onRetry }: { onRetry: () => void }) {
  // Sessiya kutilayotganda yuklanish ekrani ochiq turadi — yopamiz
  useLayoutEffect(() => hideStaticSplash(), [])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOffIcon className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold">{UI_TEXT.offline_title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{UI_TEXT.offline}</p>
      <Button onClick={onRetry}>{UI_TEXT.retry}</Button>
    </main>
  )
}
