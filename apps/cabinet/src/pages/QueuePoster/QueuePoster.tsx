import { clinicLogoUrl, QUEUE_CABINET_UI, QUEUE_UI } from '@e-dentist/shared'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { Button, Skeleton } from '@/shared/ui'

/// Eshikka osiladigan A4 varaq: klinika nomi, katta QR, qisqa yoʻriqnoma.
/// Yon menyusiz alohida sahifa — brauzerning «Chop etish» oynasi shu
/// sahifani chiqaradi. QR brauzerda yasaladi, kod tashqariga chiqmaydi (10.8).
/// Ranglar ataylab qotirilgan: varaq qorongʻi rejimda ham oq
export function QueuePoster() {
  const { data: session } = useSession()
  const clinic = session?.clinic
  if (!clinic) return <Skeleton className="m-8 h-96" />

  const address = `${window.location.origin}/n/${clinic.queueCode}`

  return (
    <main className="min-h-dvh bg-white text-neutral-900 print:min-h-0">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="text-neutral-700">
          <Link to="/settings/navbat">
            <ArrowLeftIcon />
            {QUEUE_CABINET_UI.poster_back}
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <PrinterIcon />
          {QUEUE_CABINET_UI.poster_print}
        </Button>
      </div>

      {!clinic.queueEnabled && (
        <p className="mx-auto mt-4 max-w-xl rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 print:hidden">
          {QUEUE_CABINET_UI.poster_disabled}
        </p>
      )}

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

        <h2 className="text-5xl font-extrabold tracking-tight">{QUEUE_UI.title}</h2>

        {/* Kvadrat: A4 kengligining yarmidan koʻprogʻi — 2-3 metrdan skanerlanadi */}
        <div className="rounded-2xl border-4 border-neutral-900 bg-white p-6">
          <QRCodeSVG value={address} size={380} level="M" marginSize={0} />
        </div>

        <div className="space-y-3">
          <p className="text-3xl font-semibold">{QUEUE_CABINET_UI.poster_scan}</p>
          <p className="mx-auto max-w-md text-xl leading-snug text-neutral-600">
            {QUEUE_CABINET_UI.poster_steps}
          </p>
        </div>

        <p className="font-mono text-lg text-neutral-500">{address}</p>
      </section>
    </main>
  )
}
