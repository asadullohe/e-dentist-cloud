import { UI_TEXT } from '@e-dentist/shared'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Sheet, SheetContent, SheetTitle } from '@/shared/ui'
import { SidebarNav } from './SidebarNav'

/// Tor ekrandagi yuqori panel: menyu tugmasi va yonga chiqadigan roʻyxat
export function MobileNav() {
  const { pathname } = useLocation()
  // Menyu qaysi sahifada ochilgani saqlanadi: sahifa almashsa oʻzi yopiladi,
  // shu bilan brauzerning «orqaga» tugmasi ham hisobga olinadi
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === pathname
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null)

  return (
    <div className="bg-brand-deep sticky top-0 z-30 flex items-center gap-2 px-3 py-2.5 text-white md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={UI_TEXT.menu}
        onClick={() => setOpen(true)}
        className="text-white hover:bg-white/10 hover:text-white"
      >
        <MenuIcon />
      </Button>
      <span className="font-display font-bold tracking-tight">{UI_TEXT.brand}</span>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="bg-brand-deep flex w-64 flex-col px-3.5 pt-5 pb-4 text-white/90"
        >
          {/* Radix sarlavha talab qiladi, ekranda brend nomi allaqachon bor */}
          <SheetTitle className="sr-only">{UI_TEXT.menu}</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
