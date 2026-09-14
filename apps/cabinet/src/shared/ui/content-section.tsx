import { cn } from 'cn'
import type { ReactNode } from 'react'
import { Separator } from './separator'

interface ContentSectionProps {
  title: string
  desc: string
  /// Jadvalli boʻlimlar toʻliq kenglikda; formalar tor
  wide?: boolean
  children: ReactNode
}

/// Boʻlimning ramkasi: nom, tavsif, ajratgich, mazmun. Sozlamalar va
/// bemor kartochkasi shu ramkani ishlatadi
export function ContentSection({ title, desc, wide = false, children }: ContentSectionProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
      <Separator className="my-4" />
      <div className={cn(!wide && 'lg:max-w-xl')}>{children}</div>
    </div>
  )
}
