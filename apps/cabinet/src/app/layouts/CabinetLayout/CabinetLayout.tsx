import { UI_TEXT } from '@e-dentist/shared'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { BottomNav } from '@/widgets/BottomNav'
import { FetchBar } from '@/widgets/FetchBar'
import { Header } from '@/widgets/Header'
import { Sidebar } from '@/widgets/Sidebar'
import { TrialBanner } from '@/widgets/TrialBanner'

const MOBILE = 768
const MENU_KEY = 'edentist-cabinet-menu'

/// Yigʻilgan menyu tanlovi saqlanadi: har ochilishda qayta yigʻish zerikarli.
/// Telefonda esa menyu doim yopiq boshlanadi — ekran tor
function initialCollapsed(): boolean {
  if (window.innerWidth < MOBILE) return true
  try {
    return localStorage.getItem(MENU_KEY) === 'collapsed'
  } catch {
    return false
  }
}

export function CabinetLayout() {
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(MENU_KEY, next ? 'collapsed' : 'open')
      } catch {
        // saqlanmasa ham joriy sessiyada ishlaydi
      }
      return next
    })
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        collapsed={collapsed}
        onNavigate={() => {
          if (window.innerWidth < MOBILE) setCollapsed(true)
        }}
      />

      {/* Telefonda menyu kontent ustidan ochiladi — orqa fon bosilsa yopiladi */}
      {!collapsed && (
        <button
          type="button"
          aria-label={UI_TEXT.menu}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggle}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <FetchBar />
        <Header
          onToggleMenu={toggle}
          notice={<TrialBanner subscription={session?.subscription ?? null} />}
        />
        {/* Telefonda pastki dok kontent ustida suzadi — pastda joy qoldiriladi */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-30 md:px-6 md:py-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
