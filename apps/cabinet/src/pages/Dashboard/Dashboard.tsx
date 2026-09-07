import { UI_TEXT } from '@e-dentist/shared'
import { useSession } from '../../entities/session'
import styles from './Dashboard.module.scss'

export function Dashboard() {
  const { data: session } = useSession()

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>
          {UI_TEXT.welcome}, {session?.user.fullName}
        </h1>
        <div className={styles.subtitle}>{session?.clinic?.name}</div>
      </div>
      <div className={styles.card}>{UI_TEXT.dashboard_hint}</div>
    </>
  )
}
