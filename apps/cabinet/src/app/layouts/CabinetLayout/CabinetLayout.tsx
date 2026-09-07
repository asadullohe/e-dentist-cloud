import { Outlet } from 'react-router-dom'
import { useSession } from '../../../entities/session'
import { Sidebar } from '../../../widgets/Sidebar'
import { TrialBanner } from '../../../widgets/TrialBanner'
import styles from './CabinetLayout.module.scss'

export function CabinetLayout() {
  const { data: session } = useSession()

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <TrialBanner clinic={session?.clinic ?? null} />
        <Outlet />
      </main>
    </div>
  )
}
