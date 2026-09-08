import { CHART_UI, LAB_TEXT } from '@e-dentist/shared'
import { LOWER, UPPER } from '@e-dentist/teeth'
import { cn } from 'cn'

interface TeethPickerProps {
  value: number[]
  onChange(teeth: number[]): void
}

/// Naryad uchun tish tanlash: ikki qator FDI raqami, bosilgani belgilanadi.
/// Toʻliq odontogramma bu yerda ortiqcha — naryadga faqat raqamlar kerak
export function TeethPicker({ value, onChange }: TeethPickerProps) {
  function toggle(tooth: number) {
    onChange(
      value.includes(tooth) ? value.filter((item) => item !== tooth) : [...value, tooth].sort(),
    )
  }

  return (
    <div className="space-y-1.5">
      {[
        { label: CHART_UI.upper_jaw, row: UPPER },
        { label: CHART_UI.lower_jaw, row: LOWER },
      ].map(({ label, row }) => (
        <div key={label}>
          <div className="text-muted-foreground mb-1 text-xs">{label}</div>
          <div className="flex flex-wrap gap-1">
            {row.map((tooth) => (
              <button
                key={tooth}
                type="button"
                onClick={() => toggle(tooth)}
                className={cn(
                  'w-8 rounded-md border py-1 text-xs tabular-nums transition-colors',
                  value.includes(tooth)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-accent',
                )}
              >
                {tooth}
              </button>
            ))}
          </div>
        </div>
      ))}
      {value.length === 0 && (
        <p className="text-muted-foreground text-xs">{LAB_TEXT.teeth_required}</p>
      )}
    </div>
  )
}
