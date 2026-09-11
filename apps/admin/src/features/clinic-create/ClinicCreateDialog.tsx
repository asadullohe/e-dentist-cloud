import { ADMIN_UI, UI_TEXT } from '@e-dentist/shared'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateClinic } from '@/features/clinic-actions'
import { fieldErrors, formError } from '@/shared/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@/shared/ui'

const DEFAULT_TRIAL_DAYS = '14'

/// Parol maydoni ataylab yoʻq: egasiga havola ketadi va parolni oʻzi
/// qoʻyadi. Admin uni na koʻradi, na tanlaydi
export function ClinicCreateDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [trialDays, setTrialDays] = useState(DEFAULT_TRIAL_DAYS)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})

  const { mutateAsync, isPending } = useCreateClinic()
  const navigate = useNavigate()

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setTrialDays(DEFAULT_TRIAL_DAYS)
    setError('')
    setFields({})
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setFields({})
    try {
      const card = await mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        trialDays: Number(trialDays),
      })
      setOpen(false)
      reset()
      // Yangi klinikaning kartochkasi ochiladi: taklifnoma holati oʻsha yerda
      navigate(`/klinika/${card.id}`)
    } catch (caught) {
      setFields(fieldErrors(caught))
      setError(formError(caught))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {ADMIN_UI.new_clinic}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ADMIN_UI.new_clinic}</DialogTitle>
          <DialogDescription>{ADMIN_UI.new_clinic_hint}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-3.5">
          <div className="grid gap-1.5">
            <Label htmlFor="clinic-name">{UI_TEXT.clinic_name}</Label>
            <Input
              id="clinic-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            {fields.name && <p className="text-sm text-destructive">{fields.name}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="clinic-email">{ADMIN_UI.owner_email}</Label>
            <Input
              id="clinic-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fields.email && <p className="text-sm text-destructive">{fields.email}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="clinic-phone">{UI_TEXT.phone}</Label>
            <Input
              id="clinic-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="90 123 45 67"
            />
            {fields.phone && <p className="text-sm text-destructive">{fields.phone}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="clinic-trial">{ADMIN_UI.trial_days}</Label>
            <Input
              id="clinic-trial"
              type="number"
              min={1}
              max={366}
              value={trialDays}
              onChange={(event) => setTrialDays(event.target.value)}
              className="w-28"
            />
            {fields.trialDays && <p className="text-sm text-destructive">{fields.trialDays}</p>}
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? UI_TEXT.sending : ADMIN_UI.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
