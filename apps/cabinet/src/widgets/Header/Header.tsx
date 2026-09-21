import { LOCALE_LABELS, LOCALES, roleLabel, UI_TEXT } from '@e-dentist/shared'
import { CheckIcon, MoonIcon, PanelLeftIcon, SunIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/entities/session'
import { UserMenu } from '@/features/auth'
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
  onToggleMenu: () => void
  /// Sinov muddati / obuna holati — tepa panelning oʻng tomonida
  notice?: ReactNode
}

/// Tepa panel. Keng ekranda yon menyu tugmasi; telefonda yon menyu yoʻq
/// (pastki dok), shuning uchun xodim menyusi shu yerda — chapda
export function Header({ onToggleMenu, notice }: Props) {
  const { theme, toggle } = useTheme()
  const { locale, setLocale } = useLocale()
  const { data: session } = useSession()
  const initial = (session?.user.fullName ?? session?.user.email ?? '?').trim().charAt(0)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      {/* Telefonda yon menyu oʻrniga pastki dok — tugma faqat keng ekranda */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMenu}
        aria-label={UI_TEXT.menu}
        className="hidden md:inline-flex"
      >
        <PanelLeftIcon />
      </Button>
      <UserMenu
        side="bottom"
        className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-2 pl-1 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
      >
        <span className="bg-primary/12 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
          {initial}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium">
            {session?.user.fullName ?? session?.user.email}
          </span>
          <span className="text-muted-foreground block truncate text-[11px]">
            {session?.role ? roleLabel(session.role) : ''}
          </span>
        </span>
      </UserMenu>

      <div className="ml-auto flex min-w-0 items-center gap-1">
        {notice}
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
