import styles from './Empty.module.scss'

interface EmptyProps {
  icon?: string
  text: string
}

export function Empty({ icon = '🗂', text }: EmptyProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      <div>{text}</div>
    </div>
  )
}
