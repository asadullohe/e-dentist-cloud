'use client'

import { UI_TEXT } from '@e-dentist/shared'
import { cn } from 'cn'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type * as React from 'react'

import { Button } from '@/shared/ui/button'

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn('sheet-scrim fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  )
}

/// Modal: telefonda (< sm) pastdan chiqadigan varaq — toʻliq kenglik, tepasi
/// yumaloq, tutqich, pastdan suzib chiqadi; keng ekranda markazda. Animatsiya
/// `dialog-content` (index.css), kenglik `sm:max-w-*` bilan beriladi
/// Telefon: shadcn/Tailwind `sm` chegarasi
const isPhone = () => window.matchMedia('(max-width: 639px)').matches

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        // Telefonda birinchi maydonga avtomatik fokus yoʻq: klaviatura chiqib
        // varaqni yopib qoʻyardi, maydon esa yopishqoq sarlavha ostiga surilardi.
        // Fokus varaqning oʻziga — Escape va fokus qamovi ishlayveradi
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented || !isPhone()) return
          event.preventDefault()
          ;(event.currentTarget as HTMLElement | null)?.focus?.()
        }}
        className={cn(
          // `*:min-w-0`: bolalar oʻz mazmunidan kengaymasin — uzun summa yoki
          // jadval telefonda oynadan chiqib ketmasin. Flex ustun, grid emas:
          // grid bolasi oʻz katagidan tashqariga yopisha olmaydi (sticky).
          // Telefonda tutqich chizigʻi, sarlavha (DialogHeader) va tugmalar
          // (DialogFooter) yopishqoq — faqat mazmun aylanadi; pastki joy
          // `after` orqali (pastki padding boʻlsa sticky uning ustida toʻxtaydi)
          // `overscroll-contain`: mazmun oxiriga yetganda aylantirish orqadagi
          // sahifaga oʻtmasin; `svh` (dvh emas): iOS da asboblar paneli
          // yigʻilganda varaq balandligi sakramasin
          // `scroll-pt`: maydonga fokus tushib aylantirilganda u yopishqoq
          // sarlavha ostida qolmasin
          'dialog-content fixed inset-x-0 bottom-0 z-50 flex max-h-[92svh] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[20px] border bg-background px-4 pt-0 pb-0 shadow-lg outline-none *:min-w-0 max-sm:scroll-pt-32 max-sm:after:block max-sm:after:h-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:after:shrink-0',
          'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6 sm:pb-6',
          className,
        )}
        {...props}
      >
        {/* Tutqich chizigʻi + yopish — yopishqoq tepa. Balandligi 52px, pastki
            16px oraliqni (gap-4) yopadi (-mb-4): joyda 36px — DialogHeader
            shu balandlikda (top-9) yopishadi, aylanayotgan mazmun koʻrinmaydi */}
        <div className="sticky top-0 z-30 -mx-4 -mb-4 flex h-13 shrink-0 items-center bg-background px-4 pt-2 pb-4 sm:hidden">
          <span className="w-7" />
          <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-foreground/15" />
          {showCloseButton ? (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="-mr-1 flex size-7 items-center justify-center rounded-md opacity-70 hover:opacity-100 [&_svg]:size-4"
            >
              <XIcon />
              <span className="sr-only">{UI_TEXT.close}</span>
            </DialogPrimitive.Close>
          ) : (
            <span className="w-7" />
          )}
        </div>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 hidden rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground sm:inline-flex [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">{UI_TEXT.close}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2 text-center sm:text-left',
        // Telefonda tutqich ostida yopishqoq: tutqich qatori 52px (joyda 36 +
        // 16 oraliq) — sarlavha shu balandlikdan (top-13). Ostida 8px ochiq
        // oraliq qoladi — soya bilan mazmun ostidan oʻtayotgani koʻrinadi
        'max-sm:sticky max-sm:top-13 max-sm:z-20 max-sm:-mx-4 max-sm:-mb-2 max-sm:shrink-0 max-sm:bg-background max-sm:px-4 max-sm:pb-3',
        // Pastki soya — mazmun ostidan oʻtayotgani bilinsin
        'max-sm:shadow-[0_8px_12px_-10px_rgba(15,23,42,.35)]',
        className,
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        // Telefonda pastda yopishqoq: tepasida 8px ochiq oraliq (soya bilan),
        // pastki xavfsiz joyni oʻzi yopadi (varaq pastki joyi shu yerda)
        'max-sm:sticky max-sm:bottom-0 max-sm:z-20 max-sm:-mx-4 max-sm:-mt-2 max-sm:-mb-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:shrink-0 max-sm:bg-background max-sm:px-4 max-sm:pt-3 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        // Tepa soya — mazmun ostidan oʻtayotgani bilinsin
        'max-sm:shadow-[0_-8px_12px_-10px_rgba(15,23,42,.35)]',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
