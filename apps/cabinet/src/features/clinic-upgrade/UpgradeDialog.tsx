import { SOLO_MAX_ASSISTANTS, STAFF_UI } from '@e-dentist/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'

/// Individual kabinet chegarasi (tz.md 20-boʻlim): boshqa rol yoki
/// chegaradan ortiq assistent — klinikaga oʻtish kerakligini tushuntiradi
export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{STAFF_UI.upgrade_title}</AlertDialogTitle>
          <AlertDialogDescription>
            {STAFF_UI.upgrade_text(SOLO_MAX_ASSISTANTS)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{STAFF_UI.upgrade_ok}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
