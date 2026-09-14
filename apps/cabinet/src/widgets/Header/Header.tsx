import { LOCALE_LABELS, LOCALES, UI_TEXT } from '@e-dentist/shared'
import { CheckIcon, MoonIcon, PanelLeftIcon, SunIcon } from 'lucide-react'
import { useLocale, useTheme } from '@/shared/lib'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flag,
} from '@/shared/ui'

interface Props {
  title: string
  onToggleMenu: () => void
}

/// Tepa panel. Katta ekranda sahifa nomi kontent ichida — bu yerda
/// takrorlanmaydi; telefonda yon menyu yopiq, shuning uchun nom shu yerda
export function Header({ title, onToggleMenu }: Props) {
  const { theme, toggle } = useTheme()
  const { locale, setLocale } = useLocale()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" onClick={onToggleMenu} aria-label={UI_TEXT.menu}>
        <PanelLeftIcon />
      </Button>
      <h1 className="truncate text-sm font-medium md:hidden">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Joriy tilning bayrogʻi va kodi — belgi emas, koʻrinib turadi */}
            <Button variant="ghost" size="sm" aria-label={UI_TEXT.language} className="gap-2 px-2">
              <Flag locale={locale} />
              <span className="text-xs font-medium uppercase">{locale}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LOCALES.map((code) => (
              <DropdownMenuItem key={code} onSelect={() => setLocale(code)}>
                <Flag locale={code} />
                <span className="flex-1">{LOCALE_LABELS[code]}</span>
                {code === locale && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === 'dark' ? UI_TEXT.theme_light : UI_TEXT.theme_dark}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </header>
  )
}
