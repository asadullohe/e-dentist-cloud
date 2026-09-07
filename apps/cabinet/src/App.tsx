import { BOLIMLAR, KABINET } from '@e-dentist/shared'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Bolim } from './sahifalar/Bolim'
import { BoshSahifa } from './sahifalar/BoshSahifa'
import { Kabinet } from './sahifalar/Kabinet'
import { Kirish } from './sahifalar/Kirish'
import { Royxat } from './sahifalar/Royxat'
import { Tasdiqlash } from './sahifalar/Tasdiqlash'

function Himoyalangan() {
  const { men, yuklanmoqda } = useAuth()

  // Sahifa yangilanganda /api/me javobini kutamiz — aks holda kirgan
  // foydalanuvchi bir lahzaga kirish oynasiga otilib ketardi
  if (yuklanmoqda) {
    return (
      <div className="lock-screen">
        <div className="muted">{KABINET.yuklanmoqda}</div>
      </div>
    )
  }
  if (!men) return <Navigate to="/kirish" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/kirish" element={<Kirish />} />
      <Route path="/royxat" element={<Royxat />} />
      <Route path="/tasdiqlash" element={<Tasdiqlash />} />

      <Route element={<Himoyalangan />}>
        <Route path="/" element={<Kabinet />}>
          <Route index element={<BoshSahifa />} />
          {BOLIMLAR.map((b) => (
            <Route key={b.yol} path={b.yol.slice(1)} element={<Bolim nom={b.nom} ico={b.ico} />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
