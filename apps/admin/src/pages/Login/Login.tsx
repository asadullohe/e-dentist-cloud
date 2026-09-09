import { ADMIN_UI, UI_TEXT } from '@e-dentist/shared'
import { useState } from 'react'
import { useLogin } from '@/features/auth'
import { ApiError } from '@/shared/api'
import { Button, Card, Input, Label } from '@/shared/ui'

export function Login() {
  const { mutateAsync, isPending } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await mutateAsync({ email: email.trim(), password })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center">
          <div className="font-display text-primary text-xl font-bold tracking-tight">
            {ADMIN_UI.login_title}
          </div>
          <p className="text-muted-foreground text-sm">{ADMIN_UI.login_hint}</p>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="email">{UI_TEXT.email}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{UI_TEXT.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? UI_TEXT.sending : UI_TEXT.login}
          </Button>
        </form>
      </Card>
    </div>
  )
}
