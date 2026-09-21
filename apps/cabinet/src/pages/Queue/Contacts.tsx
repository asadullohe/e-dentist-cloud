import { QUEUE_UI } from '@e-dentist/shared'
import { MapPinIcon, MessageSquareIcon, PhoneIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui'

/// Sahifa pastidagi kontaktlar va «Fikr bildirish». Telefon va manzil
/// klinika sozlamasidan — boʻsh boʻlsa tugma chiqmaydi
export function Contacts({
  code,
  phone,
  address,
}: {
  code: string
  phone: string | null
  address: string | null
}) {
  return (
    <footer className="mt-auto space-y-2 pt-6">
      {(phone || address) && (
        <div className="grid grid-cols-2 gap-2">
          {phone && (
            <Button asChild variant="outline" className="h-11">
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                <PhoneIcon />
                {QUEUE_UI.call}
              </a>
            </Button>
          )}
          {address && (
            <Button asChild variant="outline" className="h-11">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPinIcon />
                {QUEUE_UI.route}
              </a>
            </Button>
          )}
        </div>
      )}
      {address && <p className="text-muted-foreground text-center text-xs">{address}</p>}
      <Button asChild variant="ghost" className="text-muted-foreground w-full">
        <Link to={`/f/${code}?from=page`}>
          <MessageSquareIcon />
          {QUEUE_UI.leave_feedback}
        </Link>
      </Button>
    </footer>
  )
}
