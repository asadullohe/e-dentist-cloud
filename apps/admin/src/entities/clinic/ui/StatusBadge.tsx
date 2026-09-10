import { ADMIN_UI } from '@e-dentist/shared'
import { Badge } from '@/shared/ui'
import type { ClinicSummary } from '../model'

/// Holat rangi bir qarashda oʻqilsin: yashil — hammasi joyida, sariq —
/// eʼtibor kerak, qizil — toʻxtatilgan. Roʻyxatda ham, kartochkada ham bir xil
export function StatusBadge({ clinic }: { clinic: ClinicSummary }) {
  if (clinic.status === 'blocked') return <Badge variant="destructive">{ADMIN_UI.blocked}</Badge>
  if (clinic.expired)
    return <Badge className="border-transparent bg-warn/15 text-warn">{ADMIN_UI.expired}</Badge>
  if (clinic.isTrial)
    return <Badge className="border-transparent bg-info/15 text-info">{ADMIN_UI.trial}</Badge>
  return <Badge className="border-transparent bg-ok/15 text-ok">{ADMIN_UI.active}</Badge>
}
