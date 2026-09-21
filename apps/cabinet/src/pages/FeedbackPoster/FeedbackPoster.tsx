import { clinicLogoUrl, FEEDBACK_CABINET_UI, FEEDBACK_UI } from '@e-dentist/shared'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { useDoctors } from '@/entities/staff'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui'

/// Radix Select boʻsh satrni qabul qilmaydi
const GENERAL = '__general__'

/// Fikr QR varagʻi (A4): chiqish eshigiga umumiy, shifokor xonasiga — shu
/// shifokor oldindan tanlangan. Navbat varagʻi bilan bir uslub: yon menyusiz,
/// ranglar qotirilgan — qorongʻi rejimda ham oq
export function FeedbackPoster() {
  const { data: session } = useSession()
  const { data: doctors } = useDoctors()
  const [params, setParams] = useSearchParams()
  const doctorId = params.get('doctor') ?? GENERAL

  const clinic = session?.clinic
  if (!clinic) return <Skeleton className="m-8 h-96" />

  const doctor = doctors?.find((item) => item.id === doctorId)
  const address = `${window.location.origin}/f/${clinic.queueCode}?${
    doctor ? `doctor=${doctor.id}` : 'from=qr'
  }`

  return (
    <main className="min-h-dvh bg-white text-neutral-900 print:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="text-neutral-700">
          <Link to="/settings/fikrlar">
            <ArrowLeftIcon />
            {FEEDBACK_CABINET_UI.tab}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Select
            value={doctorId}
            onValueChange={(value) => setParams(value === GENERAL ? {} : { doctor: value })}
          >
            <SelectTrigger size="sm" className="w-56 bg-white text-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GENERAL}>{FEEDBACK_CABINET_UI.poster_general}</SelectItem>
              {doctors?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {FEEDBACK_CABINET_UI.poster_doctor}: {item.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => window.print()}>
            <PrinterIcon />
            {FEEDBACK_CABINET_UI.poster_print}
          </Button>
        </div>
      </div>

      <section className="mx-auto flex max-w-[190mm] flex-col items-center gap-8 px-8 py-14 text-center print:gap-10 print:py-6">
        <div className="flex items-center justify-center gap-4">
          {clinic.logoKey && (
            <img
              src={clinicLogoUrl(clinic.queueCode)}
              alt=""
              className="size-16 rounded-lg object-contain"
            />
          )}
          <h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
        </div>

        <h2 className="text-5xl font-extrabold tracking-tight">
          {FEEDBACK_CABINET_UI.poster_title}
        </h2>
        {doctor && <p className="text-2xl font-semibold text-neutral-700">{doctor.fullName}</p>}

        {/* Kvadrat: A4 kengligining yarmidan koʻprogʻi — 2-3 metrdan skanerlanadi */}
        <div className="rounded-2xl border-4 border-neutral-900 bg-white p-6">
          {/* Telefonda ekranga sigʻadi, chop etishda 380px */}
          <QRCodeSVG
            value={address}
            size={380}
            level="M"
            marginSize={0}
            className="h-auto w-full max-w-[380px]"
          />
        </div>

        <div className="space-y-3">
          <p className="text-3xl font-semibold">{FEEDBACK_CABINET_UI.poster_scan}</p>
          <p className="mx-auto max-w-md text-xl leading-snug text-neutral-600">
            {FEEDBACK_CABINET_UI.poster_steps}
          </p>
          <p className="text-lg text-neutral-500">{FEEDBACK_UI.subtitle}</p>
        </div>

        <p className="font-mono text-lg break-all text-neutral-500">{address}</p>
      </section>
    </main>
  )
}
