import { clinicLogoUrl, LOGO_UI, UI_TEXT } from '@e-dentist/shared'
import { ImageIcon, TrashIcon, UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ClinicCard } from '@/entities/clinic'
import { useRemoveClinicLogo, useSetClinicLogo } from '@/features/clinic-actions'
import { ApiError } from '@/shared/api'
import { Button, Card } from '@/shared/ui'

/// Logotipni klinikaning oʻzi ham qoʻya oladi (kabinet → Sozlamalar).
/// Panelda esa klinika ochib berayotganda darrov qoʻyish qulay
export function ClinicLogoCard({ clinic }: { clinic: ClinicCard }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const { mutateAsync: upload, isPending: isUploading } = useSetClinicLogo()
  const { mutateAsync: remove, isPending: isRemoving } = useRemoveClinicLogo()

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    try {
      await upload({ id: clinic.id, file })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  async function onRemove() {
    if (!confirm(LOGO_UI.confirm_remove)) return
    setError('')
    try {
      await remove(clinic.id)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Card className="gap-0 p-4">
      <h3 className="font-semibold">{LOGO_UI.title}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {clinic.hasLogo ? (
            <img
              src={clinicLogoUrl(clinic.queueCode)}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
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
              {isUploading ? LOGO_UI.uploading : clinic.hasLogo ? LOGO_UI.replace : LOGO_UI.choose}
            </Button>

            {clinic.hasLogo && (
              <Button size="sm" variant="ghost" disabled={isRemoving} onClick={onRemove}>
                <TrashIcon />
                {LOGO_UI.remove}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{LOGO_UI.requirements}</p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}

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
