import { type ClinicKind, UI_TEXT } from '@e-dentist/shared'
import { Building2, ChevronRight, Stethoscope } from 'lucide-react'
import type { ComponentType } from 'react'

interface KindOption {
  kind: ClinicKind
  icon: ComponentType<{ className?: string }>
  title: string
  hint: string
}

// Funksiya: matnlar joriy tilda oʻqilsin, import vaqtida qotib qolmasin
function kindOptions(): KindOption[] {
  return [
    {
      kind: 'clinic',
      icon: Building2,
      title: UI_TEXT.kind_clinic,
      hint: UI_TEXT.kind_clinic_hint,
    },
    {
      kind: 'solo',
      icon: Stethoscope,
      title: UI_TEXT.kind_solo,
      hint: UI_TEXT.kind_solo_hint,
    },
  ]
}

/// Roʻyxatning birinchi qadami: klinika yoki individual shifokor (tz.md 20-boʻlim)
export function KindStep({ onSelect }: { onSelect: (kind: ClinicKind) => void }) {
  return (
    <div>
      <h2 className="text-center text-base font-semibold">{UI_TEXT.kind_title}</h2>
      <div className="mt-4 space-y-3">
        {kindOptions().map(({ kind, icon: Icon, title, hint }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onSelect(kind)}
            className="hover:border-primary hover:bg-primary/5 focus-visible:ring-ring flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{title}</span>
              <span className="text-muted-foreground mt-0.5 block text-sm">{hint}</span>
            </span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
