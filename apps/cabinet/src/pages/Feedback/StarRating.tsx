import { FEEDBACK_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { StarIcon } from 'lucide-react'

/// Besh yulduz — katta, barmoq bilan bosiladi. Ostida soʻz bilan izoh
export function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <fieldset className="flex gap-1 border-0 p-0" aria-label={FEEDBACK_UI.rating}>
        {[1, 2, 3, 4, 5].map((n) => (
          // Tugma, radio emas: yulduzlar «n gacha toʻldirilgan» koʻrinishda —
          // radio ning bittasi tanlangan semantikasi bunga toʻgʻri kelmaydi
          <button
            key={n}
            type="button"
            aria-pressed={n <= value}
            aria-label={FEEDBACK_UI.rating_labels[n - 1]}
            onClick={() => onChange(n)}
            className={cn(
              'rounded-full p-1.5 transition-transform active:scale-95',
              n <= value ? 'text-warn' : 'text-muted-foreground/40',
            )}
          >
            <StarIcon className="size-10" fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </fieldset>
      <div className="h-5 text-sm font-medium">
        {value > 0 ? FEEDBACK_UI.rating_labels[value - 1] : ''}
      </div>
    </div>
  )
}
