import {
  CARD_UI,
  formatDate,
  formatMoney,
  LAB_MATERIAL_LABELS,
  LAB_TEXT,
  LAB_UI,
  LAB_WORK_TYPE_LABELS,
  maskDisplayDate,
  moneyDigits,
  parseDisplayDate,
  UI_TEXT,
  VITA_SHADES,
} from '@e-dentist/shared'
import { useEffect, useState } from 'react'
import type { LabMaterial, LabOrder, LabWorkType } from '@/entities/lab-order'
import { PatientPicker } from '@/entities/patient'
import { useStaffNames } from '@/entities/staff'
import { ApiError } from '@/shared/api'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui'
import { useSaveLabOrder } from './hooks'
import { TeethPicker } from './TeethPicker'

const WORK_TYPES = Object.keys(LAB_WORK_TYPE_LABELS) as LabWorkType[]
const MATERIALS = Object.keys(LAB_MATERIAL_LABELS) as LabMaterial[]
/// «Tanlanmagan» uchun boʻsh satr Radix Select da ishlamaydi
const NO_TECH = 'none'

interface LabFormDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  order?: LabOrder | undefined
  /// Bemor kartochkasidan ochilganda bemor allaqachon maʼlum
  patientId?: string | undefined
  /// Narxni faqat `lab.cost` boriga koʻrsatamiz
  canSeePrice: boolean
}

export function LabFormDialog({
  open,
  onOpenChange,
  order,
  patientId,
  canSeePrice,
}: LabFormDialogProps) {
  const { mutateAsync, isPending } = useSaveLabOrder(order?.id ?? null)
  const { data: staff } = useStaffNames()

  const [patient, setPatient] = useState<{ id: string | null; fio: string }>({
    id: null,
    fio: '',
  })
  const [techId, setTechId] = useState(NO_TECH)
  const [teeth, setTeeth] = useState<number[]>([])
  const [workType, setWorkType] = useState<LabWorkType>('crown')
  const [material, setMaterial] = useState<LabMaterial>('metal_ceramic')
  const [shade, setShade] = useState('')
  const [due, setDue] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (order) {
      setPatient({ id: order.patientId, fio: order.fio })
      setTechId(order.techId ?? NO_TECH)
      setTeeth(order.teeth)
      setWorkType(order.workType)
      setMaterial(order.material)
      setShade(order.shade ?? '')
      setDue(formatDate(order.dueDate))
      setPrice(order.techPrice === undefined ? '' : formatMoney(String(order.techPrice)))
      setNote(order.note ?? '')
    } else {
      setPatient({ id: patientId ?? null, fio: '' })
      setTechId(NO_TECH)
      setTeeth([])
      setWorkType('crown')
      setMaterial('metal_ceramic')
      setShade('')
      setDue('')
      setPrice('')
      setNote('')
    }
  }, [open, order, patientId])

  async function save() {
    setError('')
    const dueIso = parseDisplayDate(due)
    if (!dueIso) return setError(LAB_TEXT.due_required)
    if (teeth.length === 0) return setError(LAB_TEXT.teeth_required)
    if (!order && !patient.id) return setError(LAB_UI.patient)

    try {
      await mutateAsync({
        ...(order ? {} : { patientId: patient.id as string }),
        techId: techId === NO_TECH ? null : techId,
        teeth,
        workType,
        material,
        shade: shade || null,
        dueDate: dueIso,
        ...(canSeePrice ? { techPrice: Number(moneyDigits(price) || 0) } : {}),
        note: note || null,
      })
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{order ? LAB_UI.edit : LAB_UI.add}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          {!order && !patientId && (
            <div className="space-y-1.5">
              <Label>{LAB_UI.patient}</Label>
              <PatientPicker
                value={patient.id}
                label={patient.fio}
                onPick={(id, fio) => setPatient({ id, fio })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{LAB_UI.teeth}</Label>
            <TeethPicker value={teeth} onChange={setTeeth} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lab-work">{LAB_UI.work_type}</Label>
              <Select value={workType} onValueChange={(v) => setWorkType(v as LabWorkType)}>
                <SelectTrigger id="lab-work" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {LAB_WORK_TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-material">{LAB_UI.material}</Label>
              <Select value={material} onValueChange={(v) => setMaterial(v as LabMaterial)}>
                <SelectTrigger id="lab-material" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {LAB_MATERIAL_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-shade">{LAB_UI.shade}</Label>
              <Select
                value={shade || NO_TECH}
                onValueChange={(v) => setShade(v === NO_TECH ? '' : v)}
              >
                <SelectTrigger id="lab-shade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TECH}>{LAB_UI.tech_none}</SelectItem>
                  {VITA_SHADES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-due">{LAB_UI.due}</Label>
              <Input
                id="lab-due"
                inputMode="numeric"
                placeholder="15/12/2026"
                value={due}
                onChange={(event) => setDue(maskDisplayDate(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-tech">{LAB_UI.tech}</Label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger id="lab-tech" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TECH}>{LAB_UI.tech_none}</SelectItem>
                  {staff?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canSeePrice && (
              <div className="space-y-1.5">
                <Label htmlFor="lab-price">{LAB_UI.tech_price}</Label>
                <Input
                  id="lab-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(formatMoney(event.target.value))}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lab-note">{LAB_UI.note}</Label>
            <Textarea
              id="lab-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {CARD_UI.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            {isPending ? UI_TEXT.loading : CARD_UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
