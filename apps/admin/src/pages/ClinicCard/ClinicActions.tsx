import { ADMIN_UI, UI_TEXT } from '@e-dentist/shared'
import type { ClinicCard } from '@/entities/clinic'
import { useExtendClinic, useSetClinicKind, useSetClinicStatus } from '@/features/clinic-actions'
import { ApiError } from '@/shared/api'
import { Button, Card } from '@/shared/ui'

/// Qoʻlda toʻlov: mijoz Telegram orqali yozadi, admin shu tugmalarni
/// bosadi (tz.md 8-boʻlim)
const EXTEND_OPTIONS = [30, 90, 365]

/// Kartochkadagi amallar: muddat, tur (tz.md 20-boʻlim), bloklash
export function ClinicActions({ clinic }: { clinic: ClinicCard }) {
  const { mutate: extend, isPending: isExtending } = useExtendClinic()
  const { mutate: setStatus, isPending: isBlocking } = useSetClinicStatus()
  // Individualga oʻtkazishni server rad etishi mumkin (faol shifokor bor) —
  // sababi shu yerda koʻrinadi
  const { mutate: setKind, isPending: isChangingKind, error: kindError } = useSetClinicKind()
  const blocked = clinic.status === 'blocked'

  return (
    <>
      <Card className="flex-row flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-medium">{ADMIN_UI.extend}:</span>
        {EXTEND_OPTIONS.map((days) => (
          <Button
            key={days}
            size="sm"
            variant="outline"
            disabled={isExtending}
            onClick={() => extend({ id: clinic.id, days })}
          >
            {ADMIN_UI.extend_days(days)}
          </Button>
        ))}
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          disabled={isChangingKind}
          onClick={() =>
            setKind({ id: clinic.id, kind: clinic.kind === 'solo' ? 'clinic' : 'solo' })
          }
        >
          {clinic.kind === 'solo' ? ADMIN_UI.to_clinic : ADMIN_UI.to_solo}
        </Button>
        <Button
          size="sm"
          variant={blocked ? 'outline' : 'destructive'}
          disabled={isBlocking}
          onClick={() => setStatus({ id: clinic.id, status: blocked ? 'active' : 'blocked' })}
        >
          {blocked ? ADMIN_UI.unblock : ADMIN_UI.block}
        </Button>
      </Card>

      {kindError && (
        <p className="text-sm font-medium text-destructive">
          {kindError instanceof ApiError ? kindError.message : UI_TEXT.offline}
        </p>
      )}
    </>
  )
}
