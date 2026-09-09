import { ADMIN_UI, UI_TEXT } from '@e-dentist/shared'
import { LogOutIcon } from 'lucide-react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { useAdmin } from '@/entities/admin'
import { useLogout } from '@/features/auth'
import { ClinicCard } from '@/pages/ClinicCard'
import { Clinics } from '@/pages/Clinics'
import { Login } from '@/pages/Login'
import { Stats } from '@/pages/Stats'
import { Button, Skeleton } from '@/shared/ui'

/// Panel bitta ekrandan iborat: kirish yoki klinikalar. Kabinetdagi kabi
/// yon menyu keyin, boʻlimlar koʻpayganda qoʻshiladi (5.3, 5.4)
function Shell() {
  const { data: admin } = useAdmin()
  const { mutateAsync: logout } = useLogout()

  return (
    <div className="min-h-dvh">
      <header className="bg-brand-deep flex items-center justify-between gap-4 px-4 py-2.5 text-white">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold tracking-tight">{ADMIN_UI.brand}</span>
          <nav className="flex gap-3 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'text-white' : 'text-white/60')}
            >
              {ADMIN_UI.clinics}
            </NavLink>
            <NavLink
              to="/statistika"
              className={({ isActive }) => (isActive ? 'text-white' : 'text-white/60')}
            >
              {ADMIN_UI.stats}
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">{admin?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="border-white/25 bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon />
            {UI_TEXT.logout}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<Clinics />} />
          <Route path="/klinika/:id" element={<ClinicCard />} />
          <Route path="/statistika" element={<Stats />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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
