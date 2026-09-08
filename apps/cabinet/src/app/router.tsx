import { UI_TEXT } from '@e-dentist/shared'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useHasPermission, useSession } from '@/entities/session'
import { AcceptInvite } from '@/pages/AcceptInvite'
import { Dashboard } from '@/pages/Dashboard'
import { Debtors } from '@/pages/Debtors'
import { Expenses } from '@/pages/Expenses'
import { Lab } from '@/pages/Lab'
import { Login } from '@/pages/Login'
import { PatientCard } from '@/pages/PatientCard'
import { Patients } from '@/pages/Patients'
import { Placeholder } from '@/pages/Placeholder'
import { Queue } from '@/pages/Queue'
import { QueueBoard } from '@/pages/QueueBoard'
import { QueueScreen } from '@/pages/QueueScreen'
import { Register } from '@/pages/Register'
import { Reports } from '@/pages/Reports'
import { Schedule } from '@/pages/Schedule'
import { Services } from '@/pages/Services'
import { Settings } from '@/pages/Settings'
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

/// Texnik kirganda boshlangʻich sahifasi — naryadlar, bemorlar roʻyxati emas
/// (tz.md 7-boʻlim). Rol nomiga emas, ruxsatga qaraymiz: klinika rolni
/// oʻzgartirgan boʻlishi mumkin
function Home() {
  const hasPermission = useHasPermission()
  if (!hasPermission('patients.read') && hasPermission('lab.own')) {
    return <Navigate to="/lab" replace />
  }
  return <Dashboard />
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/invite" element={<AcceptInvite />} />
      {/* Navbat — yagona loginsiz sahifa (tz.md 14-boʻlim) */}
      <Route path="/n/:code" element={<Queue />} />
      <Route path="/n/:code/ekran" element={<QueueScreen />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<CabinetLayout />}>
          <Route index element={<Home />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientCard />} />
          <Route path="debtors" element={<Debtors />} />
          <Route path="services" element={<Services />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="lab" element={<Lab />} />
          <Route path="queue" element={<QueueBoard />} />
          {/* Qolgan boʻlimlar keyingi tasklarda toʻldiriladi */}
          {NAV_SECTIONS.filter(
            (section) =>
              ![
                '/patients',
                '/debtors',
                '/services',
                '/schedule',
                '/expenses',
                '/reports',
                '/settings',
                '/lab',
                '/queue',
              ].includes(section.path),
          ).map((section) => (
            <Route
              key={section.path}
              path={section.path.slice(1)}
              element={<Placeholder title={section.label} icon={section.icon} />}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
