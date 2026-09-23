import {
  BRIDGE_UI,
  CARD_UI,
  formatMoney,
  formatSom,
  moneyDigits,
  PLAN_TEXT,
  PLAN_UI,
} from '@e-dentist/shared'
import { bridgeSpan, CROWN_MATERIALS, crownMaterialLabel, LOWER, UPPER } from '@e-dentist/teeth'
import { useEffect, useState } from 'react'
import type { PlanGroupDraft, PlanItemDraft } from '@/entities/plan'
import { useServices, useServiceTypes } from '@/entities/service'
import { useToothChart } from '@/entities/tooth'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'

/// Radix Select boʻsh satrni qiymat sifatida qabul qilmaydi
const NO_SERVICE = 'none'

interface BridgeFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  /// Rollarni sukut boʻyicha shu bemorning tish xaritasidan aniqlash uchun
  patientId: string
  onSave(group: PlanGroupDraft, items: PlanItemDraft[]): void
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

/// Rejaga koʻprik (15.2): oraliqdagi har tish uchun **alohida band**
/// yoziladi, guruh esa ularni birlashtirib turadi. Oraliq va rol tanlash
/// tish xaritasidagi oyna bilan bir xil — shifokor ikkinchi qoidani
/// oʻrganmasin
export function BridgeFormDialog({ open, onOpenChange, patientId, onSave }: BridgeFormDialogProps) {
  const { data: services } = useServices()
  const { data: types } = useServiceTypes()
  const { data: chart } = useToothChart(patientId)

  const [from, setFrom] = useState('45')
  const [to, setTo] = useState('47')
  const [material, setMaterial] = useState('')
  const [serviceId, setServiceId] = useState(NO_SERVICE)
  const [treatment, setTreatment] = useState('')
  const [price, setPrice] = useState('')
  /// Qoʻlda oʻzgartirilgan rollar; qolgani xaritadan aniqlanadi
  const [pontics, setPontics] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFrom('45')
    setTo('47')
    setMaterial('')
    setServiceId(NO_SERVICE)
    setTreatment('')
    setPrice('')
    setPontics({})
    setError('')
  }, [open])

  const span = bridgeSpan(Number(from), Number(to))
  const statusOf = new Map((chart?.teeth ?? []).map((row) => [row.tooth, row.status]))

  // Tishi yoʻq joyga quyma tish, qolganiga tayanch koronka — server ham
  // shu qoidani ishlatadi
  function isPontic(tooth: number): boolean {
    const current = statusOf.get(tooth)
    return pontics[String(tooth)] ?? (current === 'olingan' || current === 'koprik')
  }

  function pickSpan(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      // Oraliq oʻzgardi — qoʻlda tanlangan rollar endi maʼnosiz
      setPontics({})
    }
  }

  function pickService(value: string) {
    setServiceId(value)
    setError('')
    const picked = services?.find((service) => service.id === value)
    if (!picked) return
    setTreatment(picked.name)
    setPrice(formatMoney(String(picked.price)))
  }

  const unit = Number(moneyDigits(price) || 0)

  function save() {
    const name = treatment.trim()
    if (!name) return setError(PLAN_TEXT.treatment_required)
    if (span.length < 2) return setError(BRIDGE_UI.span_same_arch)

    const group: PlanGroupDraft = {
      name: PLAN_UI.bridge_name(Number(from), Number(to)),
      teeth: span,
      pontics: span.filter(isPontic),
      material: material || null,
    }
    const items: PlanItemDraft[] = span.map((tooth) => ({
      tooth,
      serviceId: serviceId === NO_SERVICE ? null : serviceId,
      treatment: name,
      price: unit,
      qty: 1,
    }))
    onSave(group, items)
    onOpenChange(false)
  }

  // Tur boʻyicha guruhlangan roʻyxat — «Yangi ish» oynasidagi bilan bir xil
  const grouped = (types ?? [])
    .map((type) => ({ type, items: (services ?? []).filter((item) => item.typeId === type.id) }))
    .filter((group) => group.items.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{PLAN_UI.bridge_new}</DialogTitle>
          <DialogDescription>{PLAN_UI.bridge_hint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-bridge-from">{BRIDGE_UI.first_tooth}</Label>
              <Select value={from} onValueChange={pickSpan(setFrom)}>
                <SelectTrigger id="plan-bridge-from" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ToothOptions />
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-bridge-to">{BRIDGE_UI.last_tooth}</Label>
              <Select value={to} onValueChange={pickSpan(setTo)}>
                <SelectTrigger id="plan-bridge-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ToothOptions />
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{PLAN_UI.bridge_service}</Label>
            <Select value={serviceId} onValueChange={pickService}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SERVICE}>{PLAN_UI.service_none}</SelectItem>
                {grouped.map((group) => (
                  <SelectGroup key={group.type.id}>
                    <SelectLabel>{group.type.name}</SelectLabel>
                    {group.items.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} · {formatSom(service.price)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-bridge-treatment">{PLAN_UI.treatment}</Label>
              <Input
                id="plan-bridge-treatment"
                value={treatment}
                onChange={(event) => setTreatment(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-bridge-price">{PLAN_UI.price}</Label>
              <Input
                id="plan-bridge-price"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(formatMoney(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-bridge-material">{CARD_UI.material}</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger id="plan-bridge-material" className="w-full">
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
                      variant={isPontic(no) ? 'ghost' : 'default'}
                      onClick={() => setPontics({ ...pontics, [String(no)]: false })}
                    >
                      {BRIDGE_UI.role_crown}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isPontic(no) ? 'default' : 'ghost'}
                      onClick={() => setPontics({ ...pontics, [String(no)]: true })}
                    >
                      {BRIDGE_UI.role_pontic}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                {BRIDGE_UI.hint} {PLAN_UI.bridge_total(span.length)} ·{' '}
                <span className="text-foreground font-medium tabular-nums">
                  {formatSom(unit * span.length)}
                </span>
              </p>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button onClick={save} disabled={span.length < 2}>
            {CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
