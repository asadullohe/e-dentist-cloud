import { clinicLogoUrl, QUEUE_UI, UI_TEXT } from '@e-dentist/shared'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { feedbackGiven } from '@/entities/feedback'
import { useQueueBoard, useQueueStream, useQueueTicket } from '@/entities/queue'
import { ApiError } from '@/shared/api'
import { Skeleton } from '@/shared/ui'
import { PublicShell } from '@/widgets/public-shell'
import { Contacts } from './Contacts'
import { DoctorList } from './DoctorList'
import { JoinForm } from './JoinForm'
import { Steps } from './Steps'
import { Ticket } from './Ticket'

/// Olingan raqam brauzerda saqlanadi: sahifa yopilib qayta ochilsa ham
/// bemor oʻz oʻrnini koʻradi
const storageKey = (code: string) => `ed_queue_${code}`

function readTicketId(code: string): string | null {
  try {
    return localStorage.getItem(storageKey(code))
  } catch {
    // Shaxsiy rejimda localStorage yopiq boʻlishi mumkin — sahifa baribir ishlaydi
    return null
  }
}

function writeTicketId(code: string, id: string | null) {
  try {
    if (id) localStorage.setItem(storageKey(code), id)
    else localStorage.removeItem(storageKey(code))
  } catch {
    // Saqlab boʻlmasa ham raqam ekranda koʻrinadi
  }
}

/// Bemor sahifasi: uch qadam — shifokor → maʼlumotlar → raqam.
/// Qadam holatdan kelib chiqadi: raqam bor → 3, shifokor tanlangan → 2
export function Queue() {
  const { code = '' } = useParams()
  const [ticketId, setTicketId] = useState<string | null>(() => readTicketId(code))
  const [doctorId, setDoctorId] = useState<string | null>(null)

  // Navbat oʻzgarishi darhol koʻrinsin
  useQueueStream(code)
  const board = useQueueBoard(code)
  const ticket = useQueueTicket(code, ticketId)

  if (board.isPending) {
    return (
      <main className="mx-auto max-w-md space-y-3 p-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    )
  }

  if (board.isError || !board.data) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <div className="text-4xl">🚪</div>
        <p className="text-destructive mt-2 font-medium">
          {board.error instanceof ApiError ? board.error.message : UI_TEXT.offline}
        </p>
      </main>
    )
  }

  const data = board.data
  const doctor = data.doctors.find((item) => item.id === doctorId) ?? null
  const active = ticket.data && ticketId ? ticket.data : null
  const step = active ? 3 : doctor ? 2 : 1
  const serving = active
    ? (data.doctors.find((item) => item.id === active.doctorId)?.nowServing ?? null)
    : null

  return (
    <PublicShell
      logoUrl={clinicLogoUrl(code)}
      clinicName={data.clinicName}
      hasLogo={data.hasLogo}
      title={QUEUE_UI.title}
    >
      <Steps current={step} />

      {active ? (
        <Ticket
          code={code}
          ticket={active}
          nowServing={serving}
          feedbackGiven={feedbackGiven(active.id)}
          onLeave={() => {
            writeTicketId(code, null)
            setTicketId(null)
            setDoctorId(null)
          }}
        />
      ) : doctor ? (
        <JoinForm
          code={code}
          doctor={doctor}
          onBack={() => setDoctorId(null)}
          onJoined={(id) => {
            writeTicketId(code, id)
            setTicketId(id)
          }}
        />
      ) : (
        <DoctorList doctors={data.doctors} onPick={setDoctorId} />
      )}

      <Contacts code={code} phone={data.publicPhone} address={data.address} />
    </PublicShell>
  )
}
