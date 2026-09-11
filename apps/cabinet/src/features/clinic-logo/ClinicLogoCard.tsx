import { clinicLogoUrl, LOGO_UI, UI_TEXT } from '@e-dentist/shared'
import { ImageIcon, TrashIcon, UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useSession } from '@/entities/session'
import { ApiError } from '@/shared/api'
import { Button, Card } from '@/shared/ui'
import { useRemoveLogo, useUploadLogo } from './hooks'

export function ClinicLogoCard() {
  const { data: session } = useSession()
  const clinic = session?.clinic ?? null
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const { mutateAsync: upload, isPending: isUploading } = useUploadLogo()
  const { mutateAsync: remove, isPending: isRemoving } = useRemoveLogo()

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Bir xil faylni qayta tanlash ham hodisa bersin
    event.target.value = ''
    if (!file) return

    setError('')
    try {
      await upload(file)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  async function onRemove() {
    if (!confirm(LOGO_UI.confirm_remove)) return
    setError('')
    try {
      await remove()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  if (!clinic) return null

  return (
    <Card className="gap-0 p-4">
      <h2 className="font-display font-semibold">{LOGO_UI.title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{LOGO_UI.hint}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {clinic.logoKey ? (
            <img
              src={clinicLogoUrl(clinic.queueCode)}
              alt={clinic.name}
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="text-muted-foreground size-7" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon />
              {isUploading ? LOGO_UI.uploading : clinic.logoKey ? LOGO_UI.replace : LOGO_UI.choose}
            </Button>

            {clinic.logoKey && (
              <Button size="sm" variant="ghost" disabled={isRemoving} onClick={onRemove}>
                <TrashIcon />
                {LOGO_UI.remove}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{LOGO_UI.requirements}</p>
        </div>
      </div>

      {error && <p className="text-destructive mt-3 text-sm font-medium">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </Card>
  )
}
