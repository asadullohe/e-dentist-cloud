import { CHART_UI, PLAN_UI } from '@e-dentist/shared'
import { LOWER, UPPER } from '@e-dentist/teeth'
import { cn } from 'cn'

/// Reja bandiga bitta tish: FDI raqamlari ikki qatorda, bosilgani
/// belgilanadi, qayta bosilsa bekor qilinadi. «Professional tozalash» kabi
/// umumiy ish tishsiz qoladi — shuning uchun boʻsh qiymat ham toʻgʻri javob
export function ToothPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange(tooth: number | null): void
}) {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded-md border px-2.5 py-1 text-xs transition-colors',
          value === null ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
        )}
      >
        {PLAN_UI.tooth_none}
      </button>

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
                onClick={() => onChange(value === tooth ? null : tooth)}
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
