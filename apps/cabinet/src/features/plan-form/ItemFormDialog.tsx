import {
  areaNeedsTooth,
  CARD_UI,
  formatMoney,
  formatSom,
  moneyDigits,
  PLAN_TEXT,
  PLAN_UI,
  SERVICE_TEXT,
  SERVICE_UI,
} from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { PlanItemDraft } from '@/entities/plan'
import { useServices, useServiceTypes } from '@/entities/service'
import {
  Button,
  Dialog,
  DialogContent,
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
  Textarea,
} from '@/shared/ui'
import { ToothPicker } from './ToothPicker'

/// Radix Select boʻsh satrni qiymat sifatida qabul qilmaydi
const NO_SERVICE = 'none'

interface ItemFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  item?: PlanItemDraft | undefined
  /// Xaritadan kelganda tish oldindan toʻldiriladi (15.3)
  defaultTooth?: number | undefined
  /// Berilsa oynada bosqich tanlovi koʻrinadi — xaritadan qoʻshilayotganda
  /// qaysi bosqichga tushishi shu yerda ham koʻrinib tursin
  stages?: readonly { id: string; name: string }[] | undefined
  stageId?: string | undefined
  onSave(item: PlanItemDraft, stageId?: string): void
}

/// Rejaning bitta bandi. Server bilan bu yerda gaplashilmaydi — mazmun
/// butunligicha saqlanadi (PUT content), shuning uchun natija chaqiruvchiga
/// qaytariladi
export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  defaultTooth,
  stages,
  stageId,
  onSave,
}: ItemFormDialogProps) {
  const { data: services } = useServices()
  const { data: types } = useServiceTypes()

  const [tooth, setTooth] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState(NO_SERVICE)
  const [treatment, setTreatment] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [stage, setStage] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setStage(stageId ?? '')
    setTooth(item?.tooth ?? defaultTooth ?? null)
    setServiceId(item?.serviceId ?? NO_SERVICE)
    setTreatment(item?.treatment ?? '')
    setPrice(item ? formatMoney(String(item.price)) : '')
    setQty(String(item?.qty ?? 1))
    setNote(item?.note ?? '')
  }, [open, item, defaultTooth, stageId])

  /// Xizmat tanlansa nom va narx undan koʻchadi — keyin qoʻlda
  /// tahrirlash mumkin, bazaga **snapshot** tushadi
  function pickService(value: string) {
    setServiceId(value)
    // Soha oʻzgardi — oldingi «tish shart» xatosi eskirdi
    setError('')
    const picked = services?.find((service) => service.id === value)
    if (!picked) return
    setTreatment(picked.name)
    setPrice(formatMoney(String(picked.price)))
    // Tish soʻralmaydigan xizmat (19-boʻlim) — oldingi tanlov qolmasin
    if (!areaNeedsTooth(picked.area)) setTooth(null)
  }

  // Tanlangan xizmatning sohasi: yoʻq — tish ixtiyoriy, `tooth`/`range` —
  // shart, `mouth`/`arch` — maydon koʻrsatilmaydi
  const pickedService = services?.find((service) => service.id === serviceId)
  const needsTooth = pickedService === undefined ? undefined : areaNeedsTooth(pickedService.area)

  function save() {
    const name = treatment.trim()
    if (!name) return setError(PLAN_TEXT.treatment_required)
    const count = Number(qty)
    if (!Number.isInteger(count) || count < 1) return setError(PLAN_TEXT.qty_invalid)
    if (needsTooth && tooth === null) return setError(SERVICE_TEXT.tooth_required)

    onSave(
      {
        ...(item?.id ? { id: item.id } : {}),
        // Soha tish soʻramasa — boʻsh yoziladi (server ham shunday qiladi)
        tooth: needsTooth === false ? null : tooth,
        serviceId: serviceId === NO_SERVICE ? null : serviceId,
        treatment: name,
        price: Number(moneyDigits(price) || 0),
        qty: count,
        note: note.trim() || null,
      },
      stage || undefined,
    )
    onOpenChange(false)
  }

  // Tur boʻyicha guruhlangan roʻyxat: narxnoma katta boʻlsa tekis roʻyxatdan
  // kerakli xizmatni topib boʻlmaydi. `range` xizmat bu yerda yoʻq — u
  // oraliqqa qoʻyiladi, «Koʻprik» oynasidan kiritiladi (15.2)
  const grouped = (types ?? [])
    .map((type) => ({
      type,
      items: (services ?? []).filter((item) => item.typeId === type.id && item.area !== 'range'),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? PLAN_UI.item_edit : PLAN_UI.item_new}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {stages && stages.length > 1 && (
            <div className="space-y-1.5">
              <Label>{PLAN_UI.chart_stage}</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{PLAN_UI.service}</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="plan-item-treatment">{PLAN_UI.treatment}</Label>
            <Input
              id="plan-item-treatment"
              value={treatment}
              onChange={(event) => setTreatment(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-item-price">{PLAN_UI.price}</Label>
              <Input
                id="plan-item-price"
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(formatMoney(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-item-qty">{PLAN_UI.qty}</Label>
              <Input
                id="plan-item-qty"
                inputMode="numeric"
                value={qty}
                onChange={(event) => setQty(event.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {needsTooth !== false && (
            <div className="space-y-1.5">
              <Label>
                {PLAN_UI.tooth}
                {needsTooth && (
                  <span className="text-destructive font-normal">· {SERVICE_UI.required_mark}</span>
                )}
              </Label>
              <ToothPicker value={tooth} onChange={setTooth} required={needsTooth === true} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="plan-item-note">{PLAN_UI.note}</Label>
            <Textarea
              id="plan-item-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button onClick={save}>{CARD_UI.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
