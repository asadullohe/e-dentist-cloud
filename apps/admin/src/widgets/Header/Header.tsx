import { ADMIN_UI } from '@e-dentist/shared'
import { MoonIcon, PanelLeftIcon, SunIcon } from 'lucide-react'
import { useTheme } from '@/shared/lib'
import { Button } from '@/shared/ui'

interface Props {
  title: string
  onToggleMenu: () => void
}

export function Header({ title, onToggleMenu }: Props) {
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" onClick={onToggleMenu} aria-label={ADMIN_UI.menu_toggle}>
        <PanelLeftIcon />
      </Button>
      {/* Katta ekranda sahifa nomi kontent ichida turadi — bu yerda takrorlanmasin.
          Telefonda esa yon menyu yopiq, shuning uchun kontekst shu yerdan koʻrinadi */}
      <h1 className="truncate text-sm font-medium md:hidden">{title}</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="ml-auto"
        aria-label={theme === 'dark' ? ADMIN_UI.theme_light : ADMIN_UI.theme_dark}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </Button>
    </header>
  )
}
