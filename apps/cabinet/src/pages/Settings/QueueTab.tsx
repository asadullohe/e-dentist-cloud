import { QUEUE_CABINET_UI, UI_TEXT } from '@e-dentist/shared'
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/entities/session'
import { useSetQueueEnabled } from '@/features/queue-manage'
import { ApiError } from '@/shared/api'
import { Button, Card, Checkbox, Label, Skeleton } from '@/shared/ui'

/// Klinika navbatni butunlay yopa oladi (tz.md 14-boʻlim) va eshikka
/// osiladigan manzilni shu yerdan oladi
export function QueueTab() {
  const { data: session } = useSession()
  const { mutateAsync: setEnabled, isPending } = useSetQueueEnabled()
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const clinic = session?.clinic
  if (!clinic) return <Skeleton className="h-32 w-full" />

  const address = `${window.location.origin}/n/${clinic.queueCode}`

  async function toggle(next: boolean) {
    setError('')
    try {
      await setEnabled(next)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
    } catch {
      // Brauzer ruxsat bermasa manzil ekranda baribir koʻrinib turadi
      setError(UI_TEXT.offline)
    }
  }

  return (
    <Card className="max-w-2xl p-4">
      <div className="flex items-start gap-2">
        <Checkbox
          id="queue-enabled"
          checked={clinic.queueEnabled}
          disabled={isPending}
          onCheckedChange={(state) => toggle(state === true)}
        />
        <div>
          <Label htmlFor="queue-enabled">{QUEUE_CABINET_UI.enabled}</Label>
          <p className="text-muted-foreground text-sm">{QUEUE_CABINET_UI.enabled_hint}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{QUEUE_CABINET_UI.address}</Label>
        <div className="flex flex-wrap items-center gap-2">
          <code className="bg-muted rounded-md px-2 py-1 text-sm break-all">{address}</code>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? QUEUE_CABINET_UI.copied : QUEUE_CABINET_UI.copy}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={`/n/${clinic.queueCode}/ekran`} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              {QUEUE_CABINET_UI.screen_link}
            </a>
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">{QUEUE_CABINET_UI.code_hint}</p>
      </div>

      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
    </Card>
  )
}
