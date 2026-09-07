import { UI_TEXT } from '@e-dentist/shared'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  footer?: ReactNode
  /// Markazlashtirilgan koʻrinish — xabar sahifalari uchun (xat yuborildi,
  /// tasdiqlandi). Formalarda matn chapga tekislanadi
  centered?: boolean
}

export function AuthLayout({ children, footer, centered = false }: AuthLayoutProps) {
  return (
    <div className="from-primary/10 flex min-h-full items-center justify-center bg-gradient-to-b via-background to-background p-6">
      <div className="bg-card w-full max-w-md rounded-xl border p-8 text-center shadow-sm">
        <div className="font-display text-primary text-2xl font-bold tracking-tight">
          {UI_TEXT.brand}
        </div>
        <div className={centered ? 'mt-4' : 'mt-5 text-left'}>{children}</div>
        {footer && <div className="text-muted-foreground mt-4 text-sm">{footer}</div>}
      </div>
    </div>
  )
}
