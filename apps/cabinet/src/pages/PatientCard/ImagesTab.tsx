import { CARD_UI, IMAGE_UI } from '@e-dentist/shared'
import { ImagePlusIcon, Trash2Icon } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { type PatientImage, useImages } from '@/entities/patient-image'
import { useDeleteImage, useUploadImage } from '@/features/image-upload'
import { ApiError } from '@/shared/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Skeleton,
} from '@/shared/ui'

export function ImagesTab({ patientId }: { patientId: string }) {
  const { data: images, isPending } = useImages(patientId)
  const { mutateAsync: upload, isPending: isUploading } = useUploadImage(patientId)
  const { mutateAsync: remove } = useDeleteImage(patientId)

  const fileInput = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState<PatientImage | null>(null)
  const [deleting, setDeleting] = useState<PatientImage | null>(null)

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Bir xil faylni qayta tanlash ham ishlashi uchun maydon tozalanadi
    event.target.value = ''
    if (!file) return

    setError('')
    try {
      await upload({ file, caption })
      setCaption('')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : '')
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder={IMAGE_UI.caption_placeholder}
          className="max-w-xs"
        />
        <Button size="sm" disabled={isUploading} onClick={() => fileInput.current?.click()}>
          <ImagePlusIcon />
          {isUploading ? IMAGE_UI.uploading : IMAGE_UI.upload}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={pickFile}
        />
      </div>

      {error && <p className="text-destructive mb-3 text-sm font-medium">{error}</p>}

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : images?.length === 0 ? (
        <Card>
          <EmptyState icon="🖼" text={IMAGE_UI.empty} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images?.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden p-0">
              <button
                type="button"
                className="block w-full"
                onClick={() => setViewing(image)}
                aria-label={image.caption ?? IMAGE_UI.tab}
              >
                <img
                  src={image.url}
                  alt={image.caption ?? ''}
                  className="aspect-square w-full object-cover"
                />
              </button>
              {image.caption && (
                <div className="text-muted-foreground truncate px-2 py-1.5 text-xs">
                  {image.caption}
                </div>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => setDeleting(image)}
              >
                <Trash2Icon />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.caption ?? IMAGE_UI.tab}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <img
              src={viewing.url}
              alt={viewing.caption ?? ''}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{IMAGE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{IMAGE_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await remove(deleting.id)
                setDeleting(null)
              }}
            >
              {CARD_UI.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
