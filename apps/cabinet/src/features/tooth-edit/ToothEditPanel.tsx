import { CARD_UI, CHART_UI } from '@e-dentist/shared'
import {
  CROWN_MATERIALS,
  crownMaterialLabel,
  isCrowned,
  STATUS_STYLE,
  TOOTH_STATUSES,
  type ToothStatus,
  toothStatusLabel,
} from '@e-dentist/teeth'
import { cn } from 'cn'
import { CheckIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StatusSwatch, type ToothInfo } from '@/entities/tooth'
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import type { ToothPayload } from './api'
import { useSetTooth } from './hooks'

interface ToothEditPanelProps {
  patientId: string
  /// Boʻsh boʻlsa — «tishni bosing» koʻrsatmasi
  tooth: number | null
  current: ToothInfo | undefined
}

/// Xarita yonidagi panel: holat tugmasi bosilishi bilan saqlanadi, oyna
/// ochilib-yopilmaydi. Material — koronka va koʻprikda, izoh — alohida saqlanadi
export function ToothEditPanel({ patientId, tooth, current }: ToothEditPanelProps) {
  const { mutate, isPending, variables } = useSetTooth(patientId)
  const [note, setNote] = useState('')
  const savedNote = current?.note ?? ''

  // Boshqa tish tanlansa yoki server yangi izoh qaytarsa — maydon yangilanadi
  useEffect(() => setNote(savedNote), [savedNote])

  if (tooth === null) {
    return (
      <div className="bg-muted/50 text-muted-foreground rounded-xl p-4 text-sm">
        {CHART_UI.pick_hint}
      </div>
    )
  }

  // Saqlanayotganda bosilgan holat darhol koʻrinadi — server javobini kutmasdan
  const pendingHere = isPending && variables?.tooth === tooth
  const status = ((pendingHere ? variables.payload.status : current?.status) ??
    'soglom') as ToothStatus
  const material = (pendingHere ? variables.payload.material : current?.material) ?? ''
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.soglom

  const save = (patch: Partial<ToothPayload>) => {
    const next = { status, material, note: savedNote || null, ...patch }
    mutate({
      tooth,
      payload: {
        ...next,
        // Material faqat koronka va koʻprikda maʼnoli
        material: isCrowned(next.status) ? next.material : '',
      },
    })
  }

  return (
    <div className="bg-muted/50 space-y-3 rounded-xl p-4">
      <div>
        <div className="text-muted-foreground text-xs">{CHART_UI.selected_tooth}</div>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="text-2xl font-semibold tabular-nums">{tooth}</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: style.fill === 'none' ? 'var(--card)' : style.fill,
              color: style.text,
              border: `1px ${status === 'olingan' ? 'dashed' : 'solid'} ${style.stroke}`,
            }}
          >
            {toothStatusLabel(status)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1" role="radiogroup" aria-label={CARD_UI.status}>
        {TOOTH_STATUSES.map((key) => {
          const on = key === status
          const keyStyle = STATUS_STYLE[key]
          return (
            // biome-ignore lint/a11y/useSemanticElements: rangli tugma — radio input bilan chizib boʻlmaydi
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => !on && save({ status: key })}
              className={cn(
                'focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-[3px]',
                on
                  ? 'font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border-transparent',
              )}
              style={
                on
                  ? {
                      background: keyStyle.fill === 'none' ? 'var(--card)' : keyStyle.fill,
                      borderColor: keyStyle.stroke,
                      borderStyle: key === 'olingan' ? 'dashed' : 'solid',
                      color: keyStyle.text,
                    }
                  : undefined
              }
            >
              <StatusSwatch status={key} className="inline-block size-3 shrink-0 rounded-[3px]" />
              <span className="flex-1">{toothStatusLabel(key)}</span>
              {on && <CheckIcon className="size-4" />}
            </button>
          )
        })}
      </div>

      {isCrowned(status) && (
        <div className="space-y-1.5">
          <Label htmlFor="tooth-material">{CARD_UI.material}</Label>
          <Select value={material} onValueChange={(value) => save({ material: value })}>
            <SelectTrigger id="tooth-material" className="bg-card w-full">
              <SelectValue placeholder={crownMaterialLabel('')} />
            </SelectTrigger>
            <SelectContent>
              {CROWN_MATERIALS.map((key) => (
                <SelectItem key={key || 'none'} value={key}>
                  {crownMaterialLabel(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tooth-note">{CARD_UI.note}</Label>
        <Textarea
          id="tooth-note"
          rows={2}
          className="bg-card"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {note !== savedNote && (
          <Button
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={() => save({ note: note.trim() || null })}
          >
            {CARD_UI.save}
          </Button>
        )}
      </div>
    </div>
  )
}
