import { UI_TEXT } from '@e-dentist/shared'
import type { ReactNode } from 'react'
import styles from './AuthLayout.module.scss'

interface AuthLayoutProps {
  children: ReactNode
  footer?: ReactNode
  /// Markazlashtirilgan koʻrinish — xabar sahifalari uchun (xat yuborildi,
  /// tasdiqlandi). Formalarda matn chapga tekislanadi
  centered?: boolean
}

export function AuthLayout({ children, footer, centered = false }: AuthLayoutProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>{UI_TEXT.brand}</div>
        <div className={centered ? undefined : styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
