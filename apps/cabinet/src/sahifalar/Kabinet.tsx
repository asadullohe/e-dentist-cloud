// Kabinet qobigʻi: yon menyu va kontent. Menyu foydalanuvchining ruxsatlariga
// qarab shakllanadi — lekin bu faqat koʻrinish. Haqiqiy himoya serverda:
// har soʻrov `talabRuxsat` dan oʻtadi.

import { BOLIMLAR, bazaSanasi, KABINET } from '@e-dentist/shared'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, useRuxsat } from '../lib/auth'

function qolganKun(expiresAt: string): number {
  return Math.round((new Date(expiresAt).getTime() - bazaSanasi().getTime()) / 86_400_000)
}

export function Kabinet() {
  const { men, chiq } = useAuth()
  const ruxsatBor = useRuxsat()
  const navigate = useNavigate()

  const bolimlar = BOLIMLAR.filter((b) => ruxsatBor(b.ruxsat))
  const klinika = men?.clinic
  const kun = klinika?.isTrial ? qolganKun(klinika.expiresAt) : null

  async function chiqish() {
    await chiq()
    navigate('/kirish', { replace: true })
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">{KABINET.brend}</div>
        <div className="brand-sub">{klinika?.name}</div>

        <nav style={{ marginTop: 14 }}>
          {bolimlar.map((b) => (
            <NavLink
              key={b.yol}
              to={b.yol}
              className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            >
              <span className="ico">{b.ico}</span>
              {b.nom}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
            {men?.user.fullName} · {men?.role?.name}
          </div>
          <button type="button" className="btn secondary" onClick={chiqish}>
            {KABINET.chiqish}
          </button>
        </div>
      </aside>

      <main className="main">
        {kun !== null && (
          <div className="trial-bar">
            {kun > 0 ? KABINET.sinov_qoldi(kun) : KABINET.sinov_tugadi}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
