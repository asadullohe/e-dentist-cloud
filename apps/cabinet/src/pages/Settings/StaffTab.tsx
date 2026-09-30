import { SOLO_MAX_ASSISTANTS, STAFF_UI, UI_TEXT } from '@e-dentist/shared'
import { PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '@/entities/session'
import {
  type StaffMember,
  type StaffStatus,
  useDoctors,
  useRoles,
  useStaff,
} from '@/entities/staff'
import { UpgradeDialog } from '@/features/clinic-upgrade'
import {
  AssistantDoctorsDialog,
  PayTermsDialog,
  StaffDialog,
  useUpdateStaff,
} from '@/features/staff-manage'
import { ApiError } from '@/shared/api'
import {
  Button,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { StaffRow } from './StaffRow'

const ASSISTANT = 'assistent'

export function StaffTab() {
  const { data: session } = useSession()
  const { data: staff, isPending } = useStaff()
  const { data: roles } = useRoles()
  const { data: doctors } = useDoctors()
  const { mutateAsync: update } = useUpdateStaff()

  const [addOpen, setAddOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [payFor, setPayFor] = useState<StaffMember | null>(null)
  // Assistent shifokorlari; `roleId` — rol assistentga almashtirilayotgan boʻlsa
  const [doctorsFor, setDoctorsFor] = useState<{ person: StaffMember; roleId?: string } | null>(
    null,
  )
  const [error, setError] = useState('')

  const solo = session?.clinic?.kind === 'solo'
  // Individualda shifokor bitta — egasi; assistent ostida koʻrsatish shart emas
  const doctorNames = useMemo(
    () =>
      solo ? null : new Map((doctors ?? []).map((doctor) => [doctor.id, doctor.fullName ?? ''])),
    [solo, doctors],
  )
  const activeAssistants =
    staff?.filter((p) => p.roleTemplate === ASSISTANT && p.status === 'active').length ?? 0

  async function change(id: string, payload: { roleId?: string; status?: StaffStatus }) {
    setError('')
    try {
      await update({ id, ...payload })
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'upgrade_required') setUpgradeOpen(true)
      else setError(caught instanceof Error ? caught.message : UI_TEXT.offline)
    }
  }

  function changeRole(person: StaffMember, roleId: string) {
    const template = roles?.find((role) => role.id === roleId)?.template
    // Individualda boshqa rol yoʻq — soʻrov yubormasdan tushuntiramiz
    if (solo && template !== ASSISTANT) {
      setUpgradeOpen(true)
      return
    }
    // Klinikada assistent shifokorsiz boʻlmaydi — avval kimga yordam berishi
    if (!solo && template === ASSISTANT && person.roleTemplate !== ASSISTANT) {
      setDoctorsFor({ person: { ...person, doctorIds: [] }, roleId })
      return
    }
    void change(person.id, { roleId })
  }

  function openAdd() {
    if (solo && activeAssistants >= SOLO_MAX_ASSISTANTS) setUpgradeOpen(true)
    else setAddOpen(true)
  }

  if (isPending) return <Skeleton className="h-40 w-full" />

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <PlusIcon />
          {STAFF_UI.add}
        </Button>
      </div>

      {error && <p className="text-destructive mb-3 text-sm font-medium">{error}</p>}

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{STAFF_UI.name}</TableHead>
              <TableHead className="hidden w-48 xl:table-cell">{STAFF_UI.last_login}</TableHead>
              <TableHead className="sm:w-44">{STAFF_UI.role}</TableHead>
              <TableHead className="hidden w-44 sm:table-cell">{STAFF_UI.pay}</TableHead>
              <TableHead className="w-14 text-right xl:w-40">{STAFF_UI.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((person) => (
              <StaffRow
                key={person.id}
                person={person}
                isSelf={person.id === session?.user.id}
                roles={roles ?? []}
                doctorNames={doctorNames}
                onRole={(roleId) => changeRole(person, roleId)}
                onStatus={(status) => void change(person.id, { status })}
                onPay={() => setPayFor(person)}
                onDoctors={() => setDoctorsFor({ person })}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      <StaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onUpgradeRequired={() => setUpgradeOpen(true)}
      />
      <PayTermsDialog
        open={payFor !== null}
        onOpenChange={(open) => !open && setPayFor(null)}
        person={payFor}
      />
      <AssistantDoctorsDialog
        person={doctorsFor?.person ?? null}
        roleId={doctorsFor?.roleId}
        onOpenChange={(open) => !open && setDoctorsFor(null)}
      />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}
