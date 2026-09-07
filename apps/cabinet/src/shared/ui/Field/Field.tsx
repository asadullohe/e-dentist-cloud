import { cloneElement, type ReactElement, useId } from 'react'
import styles from './Field.module.scss'

interface FieldProps {
  label: string
  error?: string | undefined
  children: ReactElement<{ id?: string }>
}

export function Field({ label, error, children }: FieldProps) {
  // Yorliq maydonga bogʻlanadi: ekran oʻqiydigan dastur uni oʻqisin va
  // yorliqni bosganda kursor maydonga tushsin
  const id = useId()

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {cloneElement(children, { id })}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
