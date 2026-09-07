import { UI_TEXT } from '@e-dentist/shared'
import { useSession } from '@/entities/session'
import { Card, CardContent } from '@/shared/ui'

export function Dashboard() {
  const { data: session } = useSession()

  return (
    <>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {UI_TEXT.welcome}, {session?.user.fullName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{session?.clinic?.name}</p>
      </div>
      <Card>
        <CardContent className="text-muted-foreground text-sm">
          {UI_TEXT.dashboard_hint}
        </CardContent>
      </Card>
    </>
  )
}
