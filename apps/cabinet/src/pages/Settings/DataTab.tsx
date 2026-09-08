import { EXPORT_UI, UI_TEXT } from '@e-dentist/shared'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { ApiError, downloadFile } from '@/shared/api'
import { Button, Card } from '@/shared/ui'

/// «Barcha maʼlumotni yuklab olish» — tz.md 10-boʻlim: mijoz maʼlumoti
/// har doim uning qoʻlida boʻlishi kerak
export function DataTab() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setBusy(true)
    setError('')
    try {
      await downloadFile('/export')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-2xl p-4">
      <h2 className="font-display font-semibold">{EXPORT_UI.title}</h2>
      <p className="text-muted-foreground text-sm">{EXPORT_UI.hint}</p>
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
      <div>
        <Button onClick={download} disabled={busy}>
          <DownloadIcon />
          {busy ? EXPORT_UI.preparing : EXPORT_UI.download}
        </Button>
      </div>
    </Card>
  )
}
