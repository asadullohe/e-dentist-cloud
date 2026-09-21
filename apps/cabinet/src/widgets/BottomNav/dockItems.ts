import type { Permission } from '@e-dentist/shared'
import type { LucideIcon } from 'lucide-react'
import { type NavSection, navSections, settingsItems } from '@/shared/config'

export interface DockItem {
  path: string
  label: string
  icon: LucideIcon
}

/// Dokda nechta tab (+ «Yana»)
export const DOCK_SIZE = 4

type Allowed = (permission: Permission | readonly Permission[]) => boolean

const allowed = (section: { permission?: Permission | readonly Permission[] }, can: Allowed) =>
  !section.permission || can(section.permission)

/// Dok tablari: yon menyu tartibida ruxsati borlarning birinchi toʻrttasi —
/// egasiga Bosh sahifa · Bemorlar · Jadval · Navbat, shifokorga Jadvaldan
/// keyin Texnik ishlari, texnikka faqat Bosh sahifa · Texnik ishlari
export function dockItems(can: Allowed): DockItem[] {
  return navSections()
    .filter((section) => section.path !== '/settings' && allowed(section, can))
    .slice(0, DOCK_SIZE)
    .map(({ path, label, icon }) => ({ path, label, icon }))
}

/// «Yana» varagʻidagi plitkalar: dokka sigʻmagan boʻlimlar + sozlamalar
/// boʻlimlari (Hisobim bundan mustasno — hisob qatori pastda alohida)
export function moreItems(can: Allowed): DockItem[] {
  const dock = new Set(dockItems(can).map((item) => item.path))
  const sections = navSections()
    .filter((section) => section.path !== '/settings' && !dock.has(section.path))
    .filter((section) => allowed(section, can))
    .map(({ path, label, icon }: NavSection) => ({ path, label, icon }))
  const settings = settingsItems()
    .filter((item) => item.to !== '/settings' && allowed(item, can))
    .map(({ to, label, icon }) => ({ path: to, label, icon }))
  return [...sections, ...settings]
}

/// Manzil qaysi boʻlimga tegishli: `/patients/123` → `/patients`
export function activePath(pathname: string, items: DockItem[]): string | null {
  return (
    items.find((item) => (item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)))
      ?.path ?? null
  )
}
