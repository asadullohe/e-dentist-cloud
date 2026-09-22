import { CARD_UI } from '@e-dentist/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

/// Oʻchirish tasdigʻi. Matnlarni chaqiruvchi beradi — xizmat,
/// reja bosqichi va boshqa joylar uchun bitta oyna
export function DeleteDialog({
  open,
  title,
  text,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  text: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>{CARD_UI.delete}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
