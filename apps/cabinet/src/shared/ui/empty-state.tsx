interface EmptyStateProps {
  icon?: string
  text: string
}

export function EmptyState({ icon = '🗂', text }: EmptyStateProps) {
  return (
    <div className="text-muted-foreground px-5 py-11 text-center">
      <div className="mb-2 text-4xl">{icon}</div>
      <div>{text}</div>
    </div>
  )
}
