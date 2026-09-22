import {
  CARD_UI,
  ERROR_TEXT,
  formatDate,
  formatMoney,
  formatSom,
  moneyDigits,
  PLAN_UI,
  parseDisplayDate,
  VALIDATION_TEXT,
} from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Plan } from '@/entities/plan'
import { useHasPermission } from '@/entities/session'
import { useStaffNames } from '@/entities/staff'
import { ApiError } from '@/shared/api'
import {
  Button,
  DatePicker,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import { useSavePlan } from './hooks'

interface PlanFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  patientId: string
  plan?: Plan | undefined
  /// Bemorga biriktirilgan shifokor — yangi rejada sukut
  defaultDoctorId?: string | null
}

/// Rejaning xossalari: nomi, shifokori, chegirmasi va narx muddati.
/// Bosqichlar va ishlar reja sahifasida tahrirlanadi
export function PlanFormDialog({
  open,
  onOpenChange,
  patientId,
  plan,
  defaultDoctorId,
}: PlanFormDialogProps) {
  const { mutateAsync, isPending } = useSavePlan(plan?.id ?? null)
  const { data: staff } = useStaffNames()
  const hasPermission = useHasPermission()
  const navigate = useNavigate()
  // Shifokorni faqat hamma bemorni koʻradigan (egasi) almashtira oladi —
  // server ham shuni talab qiladi
  const canPickDoctor = hasPermission('patients.all')

  const [title, setTitle] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [discount, setDiscount] = useState('')
  const [percent, setPercent] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setPercent('')
    setTitle(plan?.title ?? '')
    setDoctorId(plan?.doctorId ?? defaultDoctorId ?? '')
    setDiscount(plan ? formatMoney(String(plan.discount)) : '')
    setValidUntil(plan?.validUntil ? formatDate(plan.validUntil) : '')
    setNote(plan?.note ?? '')
  }, [open, plan, defaultDoctorId])

  /// Foiz kiritilsa chegirma jamidan hisoblanadi. Bazaga baribir soʻm
  /// tushadi (qaror 22/09/2026) — keyin ishlar oʻzgarsa chegirma qotib qoladi
  function applyPercent(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 2)
    setPercent(digits)
    const total = plan?.total ?? 0
    if (!digits || total === 0) return
    setDiscount(formatMoney(String(Math.round((total * Number(digits)) / 100))))
  }

  async function save() {
    setError('')
    const iso = validUntil ? parseDisplayDate(validUntil) : null
    if (validUntil && !iso) return setError(VALIDATION_TEXT.date_invalid)

    try {
      const saved = await mutateAsync({
        ...(plan ? {} : { patientId }),
        ...(canPickDoctor && doctorId ? { doctorId } : {}),
        ...(title.trim() ? { title: title.trim() } : {}),
        discount: Number(moneyDigits(discount) || 0),
        validUntil: iso,
        note: note.trim() || null,
      })
      onOpenChange(false)
      // Yangi reja darhol ochiladi — bosqich va ishlar oʻsha yerda qoʻshiladi
      if (!plan) navigate(`/patients/${patientId}/reja/${saved.id}`)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : ERROR_TEXT.internal)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? PLAN_UI.form_edit : PLAN_UI.form_new}</DialogTitle>
          <DialogDescription>{PLAN_UI.title_hint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-title">{PLAN_UI.title}</Label>
            <Input
              id="plan-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {canPickDoctor && (
            <div className="space-y-1.5">
              <Label>{PLAN_UI.doctor}</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staff?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="plan-discount">{PLAN_UI.discount}</Label>
            <div className="flex gap-2">
              <Input
                id="plan-discount"
                inputMode="numeric"
                value={discount}
                onChange={(event) => {
                  setPercent('')
                  setDiscount(formatMoney(event.target.value))
                }}
              />
              {/* Foiz — faqat ishlar bor rejada: jami boʻlmasa hisoblab boʻlmaydi */}
              {(plan?.total ?? 0) > 0 && (
                <div className="relative w-24 shrink-0">
                  <Input
                    inputMode="numeric"
                    aria-label={PLAN_UI.discount_percent}
                    className="pr-6"
                    value={percent}
                    onChange={(event) => applyPercent(event.target.value)}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm">
                    %
                  </span>
                </div>
              )}
            </div>
            {(plan?.total ?? 0) > 0 && (
              <p className="text-muted-foreground text-xs">
                {PLAN_UI.total}: {formatSom(plan?.total ?? 0)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-valid">{PLAN_UI.valid_until}</Label>
            <DatePicker id="plan-valid" value={validUntil} onChange={setValidUntil} />
            <p className="text-muted-foreground text-xs">{PLAN_UI.valid_until_hint}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-note">{PLAN_UI.note}</Label>
            <Textarea
              id="plan-note"
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
          <Button onClick={save} disabled={isPending}>
            {CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
