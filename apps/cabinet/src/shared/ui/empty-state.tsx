import { FolderOpenIcon, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  text: string
}

/// Boʻsh roʻyxat: emoji emas, chiziqli ikonka — qolgan interfeys bilan
/// bir xil tilda
export function EmptyState({ icon: Icon = FolderOpenIcon, text }: EmptyStateProps) {
  return (
    <div className="text-muted-foreground px-5 py-11 text-center">
      <Icon className="mx-auto mb-3 size-8 opacity-60" aria-hidden="true" />
      <div className="text-sm">{text}</div>
    </div>
  )
}
