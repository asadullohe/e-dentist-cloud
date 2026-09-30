import { SOLO_MAX_ASSISTANTS, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { useHasPermission } from '@/entities/session'
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
import { useUpgradeClinic } from './hooks'

/// Individual kabinet → klinika (tz.md 20-boʻlim). Ikki kirish:
///   `limit`   — boshqa rol yoki chegaradan ortiq assistent: nima uchun kerakligi
///   `confirm` — Sozlamalardagi tugma: nima oʻzgarishi
/// Oʻtkazish tugmasi faqat obunani boshqaradiganga (egasi) — qolganlarga tushuntirish
export function UpgradeDialog({
  open,
  onOpenChange,
  reason = 'limit',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: 'limit' | 'confirm'
}) {
  const canUpgrade = useHasPermission()('billing.manage')
  const { mutateAsync, isPending } = useUpgradeClinic()

  async function upgrade() {
    await mutateAsync()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {reason === 'confirm' ? STAFF_UI.upgrade_confirm_title : STAFF_UI.upgrade_title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reason === 'confirm'
              ? STAFF_UI.upgrade_confirm_text
              : STAFF_UI.upgrade_text(SOLO_MAX_ASSISTANTS)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {canUpgrade ? (
            <>
              <AlertDialogCancel>{UI_TEXT.cancel}</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={(event) => {
                  // Soʻrov tugaguncha oyna ochiq qolsin — xato boʻlsa toast chiqadi
                  event.preventDefault()
                  void upgrade()
                }}
              >
                {isPending ? UI_TEXT.loading : STAFF_UI.upgrade_action}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction>{STAFF_UI.upgrade_ok}</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
