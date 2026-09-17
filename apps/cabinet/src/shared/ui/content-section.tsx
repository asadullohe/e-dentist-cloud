import { cn } from 'cn'
import type { ReactNode } from 'react'
import { Separator } from './separator'

interface ContentSectionProps {
  title: string
  desc: string
  /// Jadvalli boʻlimlar toʻliq kenglikda; formalar tor
  wide?: boolean
  /// `page` — boʻlim sahifaning oʻzi (Sozlamalar): sarlavha boshqa
  /// sahifalardagi kabi katta. `section` — kattaroq sahifa ichida (bemor
  /// kartochkasi), kichikroq
  heading?: 'page' | 'section'
  children: ReactNode
}

/// Boʻlimning ramkasi: nom, tavsif, ajratgich, mazmun. Sozlamalar va
/// bemor kartochkasi shu ramkani ishlatadi
export function ContentSection({
  title,
  desc,
  wide = false,
  heading = 'section',
  children,
}: ContentSectionProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div>
        {heading === 'page' ? (
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        ) : (
          <h3 className="text-lg font-medium">{title}</h3>
        )}
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
      <Separator className="my-4" />
      <div className={cn(!wide && 'lg:max-w-xl')}>{children}</div>
    </div>
  )
}
