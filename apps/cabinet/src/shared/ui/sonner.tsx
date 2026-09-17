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
      // Sukut boʻyicha 16 px boʻshliq — 54 px balandlik; bir qatorli xabar
      // uchun ortiqcha. 10/14 px → ~40 px
      toastOptions={{ style: { padding: '10px 14px' } }}
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
          // Fon — turning oʻz rangi (toʻliq), matn va belgi oq — antd uslubi.
          // Ranglar rejimga bogʻlanmagan: qorongʻi rejimdagi tokenlar ochroq,
          // ularda oq matn oʻqilmaydi — shuning uchun qotirilgan toʻq tonlar
          '--success-bg': 'oklch(0.58 0.15 163)',
          '--success-border': 'oklch(0.58 0.15 163)',
          '--success-text': '#fff',
          '--warning-bg': 'oklch(0.66 0.19 48)',
          '--warning-border': 'oklch(0.66 0.19 48)',
          '--warning-text': '#fff',
          '--error-bg': 'oklch(0.58 0.22 27)',
          '--error-border': 'oklch(0.58 0.22 27)',
          '--error-text': '#fff',
          '--info-bg': 'oklch(0.58 0.16 242)',
          '--info-border': 'oklch(0.58 0.16 242)',
          '--info-text': '#fff',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
