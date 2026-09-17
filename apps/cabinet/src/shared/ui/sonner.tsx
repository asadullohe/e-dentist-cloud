// shadcn ning tayyor varianti `next-themes` ga bogʻlangan edi — bu Next.js
// paketi, bizda kerak emas. Rejim brauzer sozlamasidan olinadi.

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      // Tepada, markazda: jadval oxiridagi tugmalarni toʻsmaydi (oʻng pastda
      // «Faollashtirish» ustiga tushib qolardi) va koʻz sahifa sarlavhasi
      // yonida — sezilarli
      position="top-center"
      // Turiga qarab rang: muvaffaqiyat yashil, ogohlantirish sariq-toʻq,
      // xato qizil. Ranglar ilovaning oʻz tokenlaridan (pastdagi style) —
      // Sonner ning oʻz palitrasi emas
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          // Fon — rangning yengil toni (popover ustida), chegara — kuchliroq,
          // matn va belgi — rangning oʻzi. Ikkala rejimda token oʻzi almashadi.
          // Aralashtirish srgb da: oklch da sariq (84°) bilan koʻkimtir fon
          // (264°) aralashganda hue aylanib, ogohlantirish pushti chiqardi
          '--success-bg': 'color-mix(in srgb, var(--ok) 14%, var(--popover))',
          '--success-border': 'color-mix(in srgb, var(--ok) 45%, var(--popover))',
          '--success-text': 'var(--ok)',
          '--warning-bg': 'color-mix(in srgb, var(--warn) 16%, var(--popover))',
          '--warning-border': 'color-mix(in srgb, var(--warn) 50%, var(--popover))',
          '--warning-text': 'color-mix(in srgb, var(--warn) 70%, var(--foreground))',
          '--error-bg': 'color-mix(in srgb, var(--destructive) 14%, var(--popover))',
          '--error-border': 'color-mix(in srgb, var(--destructive) 45%, var(--popover))',
          '--error-text': 'var(--destructive)',
          '--info-bg': 'color-mix(in srgb, var(--info) 14%, var(--popover))',
          '--info-border': 'color-mix(in srgb, var(--info) 45%, var(--popover))',
          '--info-text': 'var(--info)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
