import { UI_TEXT } from '@e-dentist/shared'
import { useNavigate } from 'react-router-dom'
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
import { useLogout } from './hooks'

/// Chiqish tasdig'i — yon menyu va telefondagi «Yana» varagʻi bitta oynani
/// ishlatadi. Tasodifiy bosishda sessiya yoʻqolmasin
export function LogoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { mutateAsync: logout, isPending } = useLogout()
  const navigate = useNavigate()

  async function confirm() {
    await logout()
    onOpenChange(false)
    navigate('/login', { replace: true })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{UI_TEXT.logout_confirm_title}</AlertDialogTitle>
          <AlertDialogDescription>{UI_TEXT.logout_confirm_text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{UI_TEXT.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              // Oyna oʻzi yopilmasin — soʻrov tugagach yopiladi va login ga oʻtadi
              event.preventDefault()
              void confirm()
            }}
          >
            {UI_TEXT.logout}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
