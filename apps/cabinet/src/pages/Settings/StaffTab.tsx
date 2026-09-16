import { formatDateTime, formatPayTerms, roleLabel, STAFF_UI } from '@e-dentist/shared'
import { PencilIcon, PlusIcon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/entities/session'
import { type StaffMember, useRoles, useStaff } from '@/entities/staff'
import { PayTermsDialog, StaffDialog, useUpdateStaff } from '@/features/staff-manage'
import {
  Badge,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

export function StaffTab() {
  const { data: session } = useSession()
  const { data: staff, isPending } = useStaff()
  const { data: roles } = useRoles()
  const { mutateAsync: update } = useUpdateStaff()

  const [addOpen, setAddOpen] = useState(false)
  const [payFor, setPayFor] = useState<StaffMember | null>(null)
  const [error, setError] = useState('')

  async function change(id: string, payload: { roleId?: string; status?: 'active' | 'disabled' }) {
    setError('')
    try {
      await update({ id, ...payload })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '')
    }
  }

  if (isPending) return <Skeleton className="h-40 w-full" />

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
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
              <TableHead className="w-44">{STAFF_UI.role}</TableHead>
              <TableHead className="hidden w-44 sm:table-cell">{STAFF_UI.pay}</TableHead>
              <TableHead className="w-14 text-right xl:w-40">{STAFF_UI.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((person) => {
              const isSelf = person.id === session?.user.id
              return (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">
                    {person.fullName ?? '—'}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2">
                        {STAFF_UI.you}
                      </Badge>
                    )}
                    <span className="text-muted-foreground block text-xs">{person.email}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden xl:table-cell">
                    {person.lastLoginAt ? formatDateTime(person.lastLoginAt) : STAFF_UI.never}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={person.roleId ?? ''}
                      disabled={isSelf}
                      onValueChange={(roleId) => change(person.id, { roleId })}
                    >
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {roleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {/* Ish haqi sharti: oylik va/yoki foiz. Oʻzinikini ham
                        oʻzgartira oladi — egasi shifokor boʻlishi mumkin */}
                    <button
                      type="button"
                      className="hover:bg-muted -mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-left"
                      aria-label={STAFF_UI.pay_title(person.fullName ?? '')}
                      onClick={() => setPayFor(person)}
                    >
                      {formatPayTerms(person.salaryAmount, person.payPercent) ? (
                        <span className="tabular-nums">
                          {formatPayTerms(person.salaryAmount, person.payPercent)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{STAFF_UI.pay_none}</span>
                      )}
                      <PencilIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Tor ekranda faqat belgi qoladi — jadval siljimasin */}
                    {person.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSelf}
                        aria-label={STAFF_UI.disable}
                        onClick={() => change(person.id, { status: 'disabled' })}
                      >
                        <UserXIcon />
                        <span className="hidden xl:inline">{STAFF_UI.disable}</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={STAFF_UI.enable}
                        onClick={() => change(person.id, { status: 'active' })}
                      >
                        <UserCheckIcon />
                        <span className="hidden xl:inline">{STAFF_UI.enable}</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <StaffDialog open={addOpen} onOpenChange={setAddOpen} />
      <PayTermsDialog
        open={payFor !== null}
        onOpenChange={(open) => !open && setPayFor(null)}
        person={payFor}
      />
    </>
  )
}
