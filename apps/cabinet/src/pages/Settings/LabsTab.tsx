import { CARD_UI, formatUzPhone, LAB_UI, UI_TEXT } from '@e-dentist/shared'
import { FlaskConicalIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { type LabPlace, useLabs } from '@/entities/lab-order'
import { LabPlaceDialog, useDeleteLab } from '@/features/lab-form'
import { ApiError } from '@/shared/api'
import { Button, Card, DeleteDialog, EmptyState, Skeleton } from '@/shared/ui'

/// Tashqi laboratoriyalar (tz.md 20-boʻlim): naryad texnik xodimga emas,
/// shu yerga berilishi mumkin
export function LabsTab() {
  const { data: labs, isPending } = useLabs()
  const { mutateAsync: remove } = useDeleteLab()
  // `undefined` — oyna yopiq; `null` — yangi laboratoriya
  const [editing, setEditing] = useState<LabPlace | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<LabPlace | null>(null)
  const [error, setError] = useState('')

  async function confirmDelete() {
    if (!deleting) return
    setError('')
    try {
      await remove(deleting.id)
    } catch (caught) {
      // Naryad berilgan laboratoriya — server tushunarli sabab qaytaradi
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
    setDeleting(null)
  }

  if (isPending) return <Skeleton className="h-32 w-full" />

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setEditing(null)}>
          <PlusIcon />
          {LAB_UI.lab_add}
        </Button>
      </div>

      {error && <p className="text-destructive mb-3 text-sm font-medium">{error}</p>}

      {labs?.length ? (
        <Card className="divide-y py-0">
          {labs.map((lab) => (
            <div key={lab.id} className="flex items-center gap-3 px-4 py-3">
              <FlaskConicalIcon className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{lab.name}</div>
                {lab.phone && (
                  <div className="text-muted-foreground text-xs">{formatUzPhone(lab.phone)}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={LAB_UI.lab_edit}
                onClick={() => setEditing(lab)}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={CARD_UI.delete}
                onClick={() => setDeleting(lab)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={FlaskConicalIcon} text={LAB_UI.labs_empty} />
      )}

      <LabPlaceDialog
        open={editing !== undefined}
        lab={editing ?? null}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
      <DeleteDialog
        open={deleting !== null}
        title={LAB_UI.lab_delete_title(deleting?.name ?? '')}
        text={LAB_UI.lab_delete_text}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
