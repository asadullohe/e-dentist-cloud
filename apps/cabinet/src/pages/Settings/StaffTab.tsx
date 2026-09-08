import { CARD_UI, formatDateTime, STAFF_UI } from '@e-dentist/shared'
import { PlusIcon, Trash2Icon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/entities/session'
import { type PendingInvite, useRoles, useStaff } from '@/entities/staff'
import { InviteDialog, useRevokeInvite, useUpdateStaff } from '@/features/staff-manage'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  const { data, isPending } = useStaff()
  const { data: roles } = useRoles()
  const { mutateAsync: update } = useUpdateStaff()
  const { mutateAsync: revoke } = useRevokeInvite()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [revoking, setRevoking] = useState<PendingInvite | null>(null)
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
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <PlusIcon />
          {STAFF_UI.invite}
        </Button>
      </div>

      {error && <p className="text-destructive mb-3 text-sm font-medium">{error}</p>}

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{STAFF_UI.name}</TableHead>
              <TableHead className="hidden w-56 lg:table-cell">{STAFF_UI.last_login}</TableHead>
              <TableHead className="w-44">{STAFF_UI.role}</TableHead>
              <TableHead className="w-14 text-right sm:w-40">{STAFF_UI.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.staff.map((person) => {
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
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
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
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <span className="hidden sm:inline">{STAFF_UI.disable}</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={STAFF_UI.enable}
                        onClick={() => change(person.id, { status: 'active' })}
                      >
                        <UserCheckIcon />
                        <span className="hidden sm:inline">{STAFF_UI.enable}</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {data && data.invites.length > 0 && (
        <>
          <h2 className="font-display mt-6 mb-2 font-semibold">{STAFF_UI.pending_title}</h2>
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{STAFF_UI.email}</TableHead>
                  <TableHead className="w-44">{STAFF_UI.role}</TableHead>
                  <TableHead className="hidden w-44 sm:table-cell">{STAFF_UI.expires}</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.email}
                      <Badge variant="secondary" className="ml-2">
                        {STAFF_UI.pending}
                      </Badge>
                    </TableCell>
                    <TableCell>{invite.roleName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {formatDateTime(invite.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={STAFF_UI.revoke}
                        onClick={() => setRevoking(invite)}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <AlertDialog open={revoking !== null} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{STAFF_UI.revoke_title}</AlertDialogTitle>
            <AlertDialogDescription>{STAFF_UI.revoke_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (revoking) await revoke(revoking.id)
                setRevoking(null)
              }}
            >
              {STAFF_UI.revoke}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
