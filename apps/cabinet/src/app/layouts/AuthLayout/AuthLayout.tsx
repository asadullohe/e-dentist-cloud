import { UI_TEXT } from '@e-dentist/shared'
import type { ReactNode } from 'react'
import { Card } from '@/shared/ui'

interface AuthLayoutProps {
  children: ReactNode
  footer?: ReactNode
  /// Markazlashtirilgan koʻrinish — xabar sahifalari uchun (xat yuborildi,
  /// tasdiqlandi). Formalarda matn chapga tekislanadi
  centered?: boolean
}

/// Kirish, roʻyxat, taklifnoma: panel bilan bir xil — logotip, karta, neytral fon
export function AuthLayout({ children, footer, centered = false }: AuthLayoutProps) {
  return (
    <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md gap-0 p-8">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="" className="size-14 rounded-2xl" />
          <div className="text-lg font-semibold tracking-tight">{UI_TEXT.brand}</div>
        </div>
        <div className={centered ? 'mt-4 text-center' : 'mt-6'}>{children}</div>
        {footer && <div className="text-muted-foreground mt-5 text-center text-sm">{footer}</div>}
      </Card>
    </div>
  )
}
