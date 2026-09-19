import { formatSom } from '@e-dentist/shared'
import { cn } from 'cn'

/// Katta summa (koʻrsatkich kartasi): raqam yirik, valyuta kichik va xira —
/// tor kartada ham sigʻadi, koʻz avval raqamga tushadi. Jadvallarda
/// `formatSom` ning oʻzi ishlatiladi
export function Money({ value, className }: { value: number; className?: string }) {
  const text = formatSom(value)
  const split = text.lastIndexOf(' ')
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {text.slice(0, split)}{' '}
      <span className="text-muted-foreground text-[0.6em] font-medium">
        {text.slice(split + 1)}
      </span>
    </span>
  )
}
