import { CHART_UI, PLAN_UI } from '@e-dentist/shared'
import { LOWER, UPPER } from '@e-dentist/teeth'
import { cn } from 'cn'

/// Reja bandiga bitta tish: FDI raqamlari ikki qatorda, bosilgani
/// belgilanadi, qayta bosilsa bekor qilinadi. Qoʻlda yozilgan umumiy ish
/// tishsiz qoladi — shuning uchun boʻsh qiymat ham toʻgʻri javob.
/// `required` — xizmatning sohasi tish soʻraydi (19-boʻlim): «tishsiz»
/// tanlovi koʻrsatilmaydi va bosilgan tishni bekor qilib boʻlmaydi
export function ToothPicker({
  value,
  onChange,
  required = false,
}: {
  value: number | null
  onChange(tooth: number | null): void
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {!required && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs transition-colors',
            value === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-accent',
          )}
        >
          {PLAN_UI.tooth_none}
        </button>
      )}

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
                onClick={() => onChange(value === tooth && !required ? null : tooth)}
                className={cn(
                  'w-8 rounded-md border py-1 text-xs tabular-nums transition-colors',
                  value === tooth
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
    </div>
  )
}
