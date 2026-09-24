import { cn } from 'cn'

/// Ikki-uch qiymatli almashtirgich (davr, guruhlash). Tanlangani oq ustki
/// qatlamda — qaysi biri faolligi bir qarashda koʻrinadi
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (next: T) => void
}) {
  return (
    <div className="bg-muted flex shrink-0 rounded-md p-0.5">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'rounded px-2 py-1.5 text-xs transition-colors md:px-3 md:text-sm',
            value === key ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
