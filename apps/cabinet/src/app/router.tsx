import { UI_TEXT } from '@e-dentist/shared'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useHasPermission, useSession } from '@/entities/session'
import { Dashboard } from '@/pages/Dashboard'
import { Debtors } from '@/pages/Debtors'
import { Expenses } from '@/pages/Expenses'
import { Invite } from '@/pages/Invite'
import { Lab } from '@/pages/Lab'
import { Login } from '@/pages/Login'
import {
  ChartSection,
  ImagesSection,
  LabSection,
  PatientCard,
  PaymentsSection,
  VisitsSection,
} from '@/pages/PatientCard'
import { Patients } from '@/pages/Patients'
import { Payroll } from '@/pages/Payroll'
import { Queue } from '@/pages/Queue'
import { QueueBoard } from '@/pages/QueueBoard'
import { QueueScreen } from '@/pages/QueueScreen'
import { Register } from '@/pages/Register'
import { Reports } from '@/pages/Reports'
import { Schedule } from '@/pages/Schedule'
import { Services } from '@/pages/Services'
import {
  AccountSection,
  ClinicSection,
  DataSection,
  QueueSection,
  RolesSection,
  Settings,
  StaffSection,
} from '@/pages/Settings'
import { VerifyEmail } from '@/pages/VerifyEmail'
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
      {/* Panel klinika ochganda egasi shu yerda parol qoʻyadi */}
      <Route path="/taklif" element={<Invite />} />
      {/* Navbat — yagona loginsiz sahifa (tz.md 14-boʻlim) */}
      <Route path="/n/:code" element={<Queue />} />
      <Route path="/n/:code/ekran" element={<QueueScreen />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<CabinetLayout />}>
          <Route index element={<Home />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientCard />}>
            <Route index element={<VisitsSection />} />
            <Route path="tishlar" element={<ChartSection />} />
            <Route path="tolovlar" element={<PaymentsSection />} />
            <Route path="rasmlar" element={<ImagesSection />} />
            <Route path="texnik" element={<LabSection />} />
          </Route>
          <Route path="debtors" element={<Debtors />} />
          <Route path="services" element={<Services />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<AccountSection />} />
            <Route path="xodimlar" element={<StaffSection />} />
            <Route path="rollar" element={<RolesSection />} />
            <Route path="klinika" element={<ClinicSection />} />
            <Route path="navbat" element={<QueueSection />} />
            <Route path="malumot" element={<DataSection />} />
          </Route>
          <Route path="lab" element={<Lab />} />
          <Route path="queue" element={<QueueBoard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
