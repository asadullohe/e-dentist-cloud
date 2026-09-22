import { CARD_UI, formatMoney, formatSom, moneyDigits, PLAN_TEXT, PLAN_UI } from '@e-dentist/shared'
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
  onSave(item: PlanItemDraft): void
}

/// Rejaning bitta bandi. Server bilan bu yerda gaplashilmaydi — mazmun
/// butunligicha saqlanadi (PUT content), shuning uchun natija chaqiruvchiga
/// qaytariladi
export function ItemFormDialog({ open, onOpenChange, item, onSave }: ItemFormDialogProps) {
  const { data: services } = useServices()
  const { data: types } = useServiceTypes()

  const [tooth, setTooth] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState(NO_SERVICE)
  const [treatment, setTreatment] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setTooth(item?.tooth ?? null)
    setServiceId(item?.serviceId ?? NO_SERVICE)
    setTreatment(item?.treatment ?? '')
    setPrice(item ? formatMoney(String(item.price)) : '')
    setQty(String(item?.qty ?? 1))
    setNote(item?.note ?? '')
  }, [open, item])

  /// Xizmat tanlansa nom va narx undan koʻchadi — keyin qoʻlda
  /// tahrirlash mumkin, bazaga **snapshot** tushadi
  function pickService(value: string) {
    setServiceId(value)
    const picked = services?.find((service) => service.id === value)
    if (!picked) return
    setTreatment(picked.name)
    setPrice(formatMoney(String(picked.price)))
  }

  function save() {
    const name = treatment.trim()
    if (!name) return setError(PLAN_TEXT.treatment_required)
    const count = Number(qty)
    if (!Number.isInteger(count) || count < 1) return setError(PLAN_TEXT.qty_invalid)

    onSave({
      ...(item?.id ? { id: item.id } : {}),
      tooth,
      serviceId: serviceId === NO_SERVICE ? null : serviceId,
      treatment: name,
      price: Number(moneyDigits(price) || 0),
      qty: count,
      note: note.trim() || null,
    })
    onOpenChange(false)
  }

  // Tur boʻyicha guruhlangan roʻyxat: narxnoma katta boʻlsa tekis roʻyxatdan
  // kerakli xizmatni topib boʻlmaydi
  const grouped = (types ?? [])
    .map((type) => ({ type, items: (services ?? []).filter((item) => item.typeId === type.id) }))
    .filter((group) => group.items.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? PLAN_UI.item_edit : PLAN_UI.item_new}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="space-y-1.5">
            <Label>{PLAN_UI.tooth}</Label>
            <ToothPicker value={tooth} onChange={setTooth} />
          </div>

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
