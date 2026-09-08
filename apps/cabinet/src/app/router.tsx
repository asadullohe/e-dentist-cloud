import { UI_TEXT } from '@e-dentist/shared'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { Dashboard } from '@/pages/Dashboard'
import { Debtors } from '@/pages/Debtors'
import { Login } from '@/pages/Login'
import { PatientCard } from '@/pages/PatientCard'
import { Patients } from '@/pages/Patients'
import { Placeholder } from '@/pages/Placeholder'
import { Register } from '@/pages/Register'
import { VerifyEmail } from '@/pages/VerifyEmail'
import { NAV_SECTIONS } from '@/shared/config'
import { AuthLayout } from './layouts/AuthLayout'
import { CabinetLayout } from './layouts/CabinetLayout'

function RequireAuth() {
  const { data: session, isPending } = useSession()

  // Sahifa yangilanganda sessiya javobini kutamiz — aks holda kirgan
  // foydalanuvchi bir lahzaga kirish oynasiga otilib ketardi
  if (isPending) {
    return (
      <AuthLayout centered>
        <p>{UI_TEXT.loading}</p>
      </AuthLayout>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<CabinetLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientCard />} />
          <Route path="debtors" element={<Debtors />} />
          {/* Qolgan boʻlimlar keyingi tasklarda toʻldiriladi */}
          {NAV_SECTIONS.filter((section) => !['/patients', '/debtors'].includes(section.path)).map(
            (section) => (
              <Route
                key={section.path}
                path={section.path.slice(1)}
                element={<Placeholder title={section.label} icon={section.icon} />}
              />
            ),
          )}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
