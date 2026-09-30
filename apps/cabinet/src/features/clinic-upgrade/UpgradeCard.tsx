import { STAFF_UI } from '@e-dentist/shared'
import { Building2Icon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '@/shared/ui'
import { UpgradeDialog } from './UpgradeDialog'

/// Sozlamalar → Kabinet: individualdan klinikaga oʻtish (tz.md 20-boʻlim)
export function UpgradeCard() {
  const [open, setOpen] = useState(false)
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Building2Icon className="size-5" />
      </span>
      <p className="text-muted-foreground min-w-0 flex-1 text-sm">{STAFF_UI.upgrade_card_text}</p>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {STAFF_UI.upgrade_action}
      </Button>
      <UpgradeDialog open={open} onOpenChange={setOpen} reason="confirm" />
    </Card>
  )
}
