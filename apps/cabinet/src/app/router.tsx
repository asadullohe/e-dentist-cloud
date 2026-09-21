import type { Permission } from '@e-dentist/shared'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useHasPermission, useSession } from '@/entities/session'
import { Dashboard } from '@/pages/Dashboard'
import { Debtors } from '@/pages/Debtors'
import { Expenses } from '@/pages/Expenses'
import { Feedback } from '@/pages/Feedback'
import { FeedbackPoster } from '@/pages/FeedbackPoster'
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
import { QueuePoster } from '@/pages/QueuePoster'
import { QueueScreen } from '@/pages/QueueScreen'
import { Register } from '@/pages/Register'
import { Reports } from '@/pages/Reports'
import { Schedule } from '@/pages/Schedule'
import { Services, ServiceTypePage } from '@/pages/Services'
import {
  AccountSection,
  ClinicSection,
  DataSection,
  FeedbackSection,
  QueueSection,
  RolesSection,
  Settings,
  StaffSection,
} from '@/pages/Settings'
import { VerifyEmail } from '@/pages/VerifyEmail'
import { Splash } from '@/shared/ui'
import { ConnectionLost } from './ConnectionLost'
import { CabinetLayout } from './layouts/CabinetLayout'

function RequireAuth() {
  const { data: session, isPending, isFetching, isError, refetch } = useSession()

  // Sahifa yangilanganda sessiya javobini kutamiz — aks holda kirgan
  // foydalanuvchi bir lahzaga kirish oynasiga otilib ketardi. Keshda
  // «kirmagan» turib qayta soʻralayotgan boʻlsa ham kutamiz: eski javob
  // asosida kirish sahifasiga qaytarib yubormaslik uchun
  if (isPending || (!session && isFetching)) return <Splash />
  if (!session) {
    // Javob kelmadi (server qayta ishga tushyapti, tarmoq) — bu «kirmagan»
    // emas: cookie joyida, login ga otish oʻrniga qayta urinish taklif qilinadi
    if (isError) return <ConnectionLost onRetry={() => void refetch()} />
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/// Marshrut darajasidagi ruxsat: yon menyu boʻlimni yashirsa ham, manzilni
/// qoʻlda yozib kirib boʻlmasin. Sanab oʻtilganlardan bittasi yetarli.
/// Haqiqiy himoya serverda — bu sahifa boʻsh/xato koʻrinmasligi uchun
function RequirePermission({ anyOf }: { anyOf: Permission[] }) {
  const hasPermission = useHasPermission()
  if (!anyOf.some((permission) => hasPermission(permission))) {
    return <Navigate to="/" replace />
  }
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
      {/* Loginsiz sahifalar: navbat va bemor fikri (tz.md 14-boʻlim) */}
      <Route path="/n/:code" element={<Queue />} />
      <Route path="/n/:code/ekran" element={<QueueScreen />} />
      <Route path="/f/:code" element={<Feedback />} />

      <Route element={<RequireAuth />}>
        {/* Eshikka osiladigan QR varaq — chop etish uchun yon menyusiz (10.8) */}
        <Route element={<RequirePermission anyOf={['staff.manage']} />}>
          <Route path="/navbat-varaq" element={<QueuePoster />} />
          <Route path="/fikr-varaq" element={<FeedbackPoster />} />
        </Route>
        <Route path="/" element={<CabinetLayout />}>
          <Route index element={<Home />} />

          <Route element={<RequirePermission anyOf={['patients.read']} />}>
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientCard />}>
              <Route index element={<VisitsSection />} />
              <Route path="tishlar" element={<ChartSection />} />
              <Route element={<RequirePermission anyOf={['payments.read']} />}>
                <Route path="tolovlar" element={<PaymentsSection />} />
              </Route>
              <Route path="rasmlar" element={<ImagesSection />} />
              <Route element={<RequirePermission anyOf={['lab.write']} />}>
                <Route path="texnik" element={<LabSection />} />
              </Route>
            </Route>
          </Route>

          <Route element={<RequirePermission anyOf={['payments.read']} />}>
            <Route path="debtors" element={<Debtors />} />
          </Route>
          <Route element={<RequirePermission anyOf={['services.manage']} />}>
            <Route path="services" element={<Services />} />
            <Route path="services/:typeId" element={<ServiceTypePage />} />
          </Route>
          <Route element={<RequirePermission anyOf={['schedule.write']} />}>
            <Route path="schedule" element={<Schedule />} />
          </Route>
          <Route element={<RequirePermission anyOf={['expenses.read']} />}>
            <Route path="expenses" element={<Expenses />} />
          </Route>
          <Route element={<RequirePermission anyOf={['reports.read']} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route element={<RequirePermission anyOf={['payroll.own', 'payroll.manage']} />}>
            <Route path="payroll" element={<Payroll />} />
          </Route>

          {/* Sozlamalar hammaga ochiq — «Hisobim» (parol) har xodimga kerak;
              boshqa boʻlimlar ruxsatga qarab */}
          <Route path="settings" element={<Settings />}>
            <Route index element={<AccountSection />} />
            <Route element={<RequirePermission anyOf={['staff.manage']} />}>
              <Route path="xodimlar" element={<StaffSection />} />
              <Route path="rollar" element={<RolesSection />} />
              <Route path="klinika" element={<ClinicSection />} />
              <Route path="navbat" element={<QueueSection />} />
            </Route>
            <Route element={<RequirePermission anyOf={['feedback.read', 'feedback.own']} />}>
              <Route path="fikrlar" element={<FeedbackSection />} />
            </Route>
            <Route element={<RequirePermission anyOf={['data.export']} />}>
              <Route path="malumot" element={<DataSection />} />
            </Route>
          </Route>

          <Route element={<RequirePermission anyOf={['lab.own', 'lab.write']} />}>
            <Route path="lab" element={<Lab />} />
          </Route>
          <Route element={<RequirePermission anyOf={['queue.manage']} />}>
            <Route path="queue" element={<QueueBoard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
