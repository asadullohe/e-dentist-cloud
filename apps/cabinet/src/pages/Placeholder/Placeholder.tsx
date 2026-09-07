// Vaqtinchalik: boʻlimlar 2-bosqichdan boshlab toʻldiriladi.
// Menyu va marshrutlar hozirdan toʻgʻri ishlashi uchun turibdi.

import { UI_TEXT } from '@e-dentist/shared'
import { Card, EmptyState } from '@/shared/ui'

interface PlaceholderProps {
  title: string
  icon: string
}

export function Placeholder({ title, icon }: PlaceholderProps) {
  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{title}</h1>
      <Card>
        <EmptyState icon={icon} text={UI_TEXT.section_soon} />
      </Card>
    </>
  )
}
