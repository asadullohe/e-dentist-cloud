import { SidebarNav } from './SidebarNav'

/// Tor ekranda yashiriladi — oʻrniga `MobileNav` chiqadi
export function Sidebar() {
  return (
    <aside className="bg-brand-deep hidden w-56 shrink-0 flex-col px-3.5 pt-5 pb-4 text-white/90 md:flex">
      <SidebarNav />
    </aside>
  )
}
