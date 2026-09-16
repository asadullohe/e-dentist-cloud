import { CARD_UI, formatMonth, PAYROLL_UI, UI_TEXT } from '@e-dentist/shared'
import { useState } from 'react'
import type { PayrollRow } from '@/entities/payroll'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import { useRecalculate } from './hooks'

interface RecalculateDialogProps {
  month: string
  /// Boʻsh — oyna yopiq
  row: PayrollRow | null
  onClose(): void
}

/// Oydagi tashriflarga xodimning joriy foizini qayta yozish. Snapshot
/// qoidasidan aniq chekinish — shuning uchun tasdiq soʻraladi (tz.md 15-boʻlim)
export function RecalculateDialog({ month, row, onClose }: RecalculateDialogProps) {
  const { mutateAsync, isPending } = useRecalculate()
  const [error, setError] = useState('')

  async function confirm() {
    if (!row) return
    setError('')
    try {
      // Natija toastda (hook `meta.success`)
      await mutateAsync({ month, userId: row.userId })
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '')
    }
  }

  return (
    <AlertDialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{PAYROLL_UI.recalculate_title}</AlertDialogTitle>
          <AlertDialogDescription>
            {row && PAYROLL_UI.recalculate_text(row.fullName, row.percent, formatMonth(month))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              // AlertDialogAction oynani oʻzi yopadi — natijani kutib, keyin yopamiz
              event.preventDefault()
              void confirm()
            }}
          >
            {isPending ? UI_TEXT.loading : PAYROLL_UI.recalculate}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
