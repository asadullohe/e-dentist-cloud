import { BRIDGE_UI, CARD_UI, UI_TEXT } from '@e-dentist/shared'
import { bridgeSpan, CROWN_MATERIALS, crownMaterialLabel, LOWER, UPPER } from '@e-dentist/teeth'
import { useEffect, useState } from 'react'
import type { ToothInfo } from '@/entities/tooth'
import { ApiError } from '@/shared/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { useCreateBridge } from './hooks'

type Role = 'koronka' | 'koprik'

interface BridgeFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  patientId: string
  teeth: ToothInfo[]
}

function ToothOptions() {
  return (
    <>
      <SelectGroup>
        <SelectLabel>{BRIDGE_UI.upper_jaw}</SelectLabel>
        {UPPER.map((no) => (
          <SelectItem key={no} value={String(no)}>
            {no}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>{BRIDGE_UI.lower_jaw}</SelectLabel>
        {LOWER.map((no) => (
          <SelectItem key={no} value={String(no)}>
            {no}
          </SelectItem>
        ))}
      </SelectGroup>
    </>
  )
}

export function BridgeFormDialog({ open, onOpenChange, patientId, teeth }: BridgeFormDialogProps) {
  const { mutateAsync, isPending } = useCreateBridge(patientId)
  const [from, setFrom] = useState('45')
  const [to, setTo] = useState('42')
  const [material, setMaterial] = useState('')
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setRoles({})
      setError('')
    }
  }, [open])

  const span = bridgeSpan(Number(from), Number(to))
  const statusOf = new Map(teeth.map((t) => [t.tooth, t.status]))

  // Tishi yoʻq joyga quyma tish, qolganiga tayanch koronka
  function roleOf(tooth: number): Role {
    const current = statusOf.get(tooth)
    return (
      roles[String(tooth)] ?? (current === 'olingan' || current === 'koprik' ? 'koprik' : 'koronka')
    )
  }

  function pickTooth(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      // Oraliq oʻzgardi — qoʻlda tanlangan rollar endi maʼnosiz
      setRoles({})
    }
  }

  async function save() {
    setError('')
    try {
      await mutateAsync({
        from: Number(from),
        to: Number(to),
        material,
        roles: Object.fromEntries(span.map((no) => [String(no), roleOf(no)])),
      })
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{BRIDGE_UI.title_new}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bridge-from">{BRIDGE_UI.first_tooth}</Label>
              <Select value={from} onValueChange={pickTooth(setFrom)}>
                <SelectTrigger id="bridge-from" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ToothOptions />
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bridge-to">{BRIDGE_UI.last_tooth}</Label>
              <Select value={to} onValueChange={pickTooth(setTo)}>
                <SelectTrigger id="bridge-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ToothOptions />
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bridge-material">{CARD_UI.material}</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger id="bridge-material" className="w-full">
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

          {span.length < 2 ? (
            <p className="text-destructive text-sm font-medium">{BRIDGE_UI.span_same_arch}</p>
          ) : (
            <div className="space-y-1.5">
              <Label>{BRIDGE_UI.span(span.length)}</Label>
              <div className="flex flex-wrap gap-2">
                {span.map((no) => (
                  <div key={no} className="flex items-center gap-1.5 rounded-md border px-2 py-1">
                    <span className="w-6 text-sm font-semibold tabular-nums">{no}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={roleOf(no) === 'koronka' ? 'default' : 'ghost'}
                      onClick={() => setRoles({ ...roles, [String(no)]: 'koronka' })}
                    >
                      {BRIDGE_UI.role_crown}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={roleOf(no) === 'koprik' ? 'default' : 'ghost'}
                      onClick={() => setRoles({ ...roles, [String(no)]: 'koprik' })}
                    >
                      {BRIDGE_UI.role_pontic}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">{BRIDGE_UI.hint}</p>
            </div>
          )}

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={span.length < 2 || isPending}>
            {isPending ? UI_TEXT.loading : CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
