import { UI_TEXT } from '@e-dentist/shared'
import { ShieldAlertIcon } from 'lucide-react'
import { useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '@/features/auth'
import { Button, hideStaticSplash } from '@/shared/ui'

/// Server sessiyani aniq rad etdi (masalan, bu platforma admini hisobi).
/// «Aloqa yoʻq» emas — qayta urinish oʻsha javobni qaytaradi, shuning uchun
/// sababi va chiqish yoʻli koʻrsatiladi. Chiqqach kirish sahifasiga —
/// `LogoutDialog` dagidek
export function SessionRejected({ message }: { message: string }) {
  useLayoutEffect(() => hideStaticSplash(), [])
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldAlertIcon className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold">{UI_TEXT.session_rejected_title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button
        onClick={() =>
          logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })
        }
        disabled={logout.isPending}
      >
        {UI_TEXT.logout}
      </Button>
      {logout.isError && (
        <p className="max-w-sm text-sm text-destructive" role="alert">
          {logout.error.message}
        </p>
      )}
    </main>
  )
}
