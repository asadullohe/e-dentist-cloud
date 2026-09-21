import { clinicLogoUrl, UI_TEXT } from '@e-dentist/shared'
import type { ReactNode } from 'react'
import { useLocale } from '@/shared/lib'
import { Button, Flag } from '@/shared/ui'

/// Ochiq sahifalarning umumiy ramkasi (navbat, fikr): til almashtirgich,
/// logotip, klinika nomi, sarlavha. Tor ustun — telefon uchun
export function PublicShell({
  code,
  clinicName,
  hasLogo,
  title,
  subtitle,
  children,
}: {
  code: string
  clinicName: string
  hasLogo: boolean
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const { locale, setLocale } = useLocale()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8">
      <div className="flex justify-end py-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2"
          aria-label={UI_TEXT.language}
          onClick={() => setLocale(locale === 'uz' ? 'ru' : 'uz')}
        >
          <Flag locale={locale === 'uz' ? 'ru' : 'uz'} />
          <span className="text-xs font-medium uppercase">{locale === 'uz' ? 'ru' : 'uz'}</span>
        </Button>
      </div>

      <header className="mb-5 flex items-center gap-3">
        {hasLogo ? (
          <img src={clinicLogoUrl(code)} alt="" className="size-12 rounded-xl object-contain" />
        ) : (
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl text-lg font-bold">
            {clinicName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-muted-foreground truncate text-xs">{clinicName}</div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
        </div>
      </header>

      {children}
    </main>
  )
}
