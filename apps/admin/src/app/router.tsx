import { ADMIN_UI } from '@e-dentist/shared'
import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAdmin } from '@/entities/admin'
import { ClinicCard } from '@/pages/ClinicCard'
import { Clinics } from '@/pages/Clinics'
import { Login } from '@/pages/Login'
import { Stats } from '@/pages/Stats'
import { Skeleton } from '@/shared/ui'
import { Header } from '@/widgets/Header'
import { Sidebar } from '@/widgets/Sidebar'

const MOBILE = 768

/// Yigʻilgan menyu tanlovi saqlanadi: har ochilishda qayta yigʻish zerikarli.
/// Telefonda esa menyu doim yopiq boshlanadi — ekran tor
function initialCollapsed(): boolean {
  if (window.innerWidth < MOBILE) return true
  try {
    return localStorage.getItem('edentist-panel-menu') === 'collapsed'
  } catch {
    return false
  }
}

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/statistika')) return ADMIN_UI.stats
  if (pathname.startsWith('/klinika/')) return ADMIN_UI.clinic
  return ADMIN_UI.clinics
}

function Shell() {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const { pathname } = useLocation()

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('edentist-panel-menu', next ? 'collapsed' : 'open')
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
          aria-label={ADMIN_UI.menu_toggle}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggle}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={pageTitle(pathname)} onToggleMenu={toggle} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Clinics />} />
            <Route path="/klinika/:id" element={<ClinicCard />} />
            <Route path="/statistika" element={<Stats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export function Router() {
  const { data: admin, isPending } = useAdmin()

  // Sahifa yangilanganda sessiya javobini kutamiz — aks holda kirgan
  // admin bir lahzaga kirish oynasiga otilib ketardi
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Skeleton className="h-9 w-40" />
      </div>
    )
  }

  return admin ? <Shell /> : <Login />
}
