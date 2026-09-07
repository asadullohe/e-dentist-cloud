import { UI_TEXT } from '@e-dentist/shared'
import { NavLink, useNavigate } from 'react-router-dom'
import { useHasPermission, useSession } from '../../entities/session'
import { useLogout } from '../../features/auth'
import { NAV_SECTIONS } from '../../shared/config'
import styles from './Sidebar.module.scss'

export function Sidebar() {
  const { data: session } = useSession()
  const hasPermission = useHasPermission()
  const { mutateAsync: logout } = useLogout()
  const navigate = useNavigate()

  const sections = NAV_SECTIONS.filter((section) => hasPermission(section.permission))

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>{UI_TEXT.brand}</div>
      <div className={styles.clinic}>{session?.clinic?.name}</div>

      <nav className={styles.nav}>
        {sections.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) => `${styles.link}${isActive ? ` ${styles.active}` : ''}`}
          >
            <span className={styles.icon}>{section.icon}</span>
            {section.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.who}>
          {session?.user.fullName} · {session?.role?.name}
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          {UI_TEXT.logout}
        </button>
      </div>
    </aside>
  )
}
