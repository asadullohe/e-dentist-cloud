import { UI_TEXT } from '@e-dentist/shared'
import { TriangleAlertIcon } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, hideStaticSplash } from '@/shared/ui'

interface State {
  failed: boolean
}

/// Ildizdagi xato chegarasi: chizishda tutilmagan xato butun ekranni oppoq
/// qilib qoʻymasin. Foydalanuvchiga — tushunarli xabar va yangilash tugmasi,
/// texnik tafsilot (xato, komponent zanjiri) — konsolga. Sinf komponenti:
/// React da xatoni tutishning boshqa yoʻli yoʻq
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
    // Sessiya kutilayotganda yiqilsa yuklanish ekrani ochiq qoladi
    hideStaticSplash()
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlertIcon className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold">{UI_TEXT.error_title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{UI_TEXT.error_text}</p>
        <Button onClick={() => window.location.reload()}>{UI_TEXT.reload}</Button>
      </main>
    )
  }
}
