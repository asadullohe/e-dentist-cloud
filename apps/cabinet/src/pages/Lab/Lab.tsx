import {
  CARD_UI,
  formatDate,
  formatSom,
  LAB_MATERIAL_LABELS,
  LAB_RETURN_REASON_LABELS,
  LAB_STATUS_LABELS,
  LAB_UI,
  LAB_WORK_TYPE_LABELS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { type LabOrder, type LabStatus, useLabOrders } from '@/entities/lab-order'
import { useHasPermission } from '@/entities/session'
import { useStaffNames } from '@/entities/staff'
import {
  LabFormDialog,
  ReturnDialog,
  useDeleteLabOrder,
  useSetLabStatus,
} from '@/features/lab-form'
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
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui'

const ALL = 'all'
const STATUSES = Object.keys(LAB_STATUS_LABELS) as LabStatus[]

function statusTone(order: LabOrder): string {
  if (order.status === 'delivered') return 'bg-ok/15 text-ok border-ok/30'
  if (order.overdue) return 'bg-destructive/10 text-destructive border-destructive/30'
  if (order.status === 'ready') return 'bg-warn/15 text-warn border-warn/30'
  return ''
}

export function Lab() {
  const hasPermission = useHasPermission()
  const canWrite = hasPermission('lab.write')

  const [status, setStatus] = useState<string>(ALL)
  const [techId, setTechId] = useState<string>(ALL)

  const { data: orders, isPending } = useLabOrders({
    ...(status === ALL ? {} : { status: status as LabStatus }),
    ...(techId === ALL || !canWrite ? {} : { techId }),
  })
  const { data: staff } = useStaffNames()
  const { mutateAsync: setLabStatus } = useSetLabStatus()
  const { mutateAsync: remove } = useDeleteLabOrder()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LabOrder | undefined>(undefined)
  const [returning, setReturning] = useState<LabOrder | null>(null)
  const [deleting, setDeleting] = useState<LabOrder | null>(null)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{LAB_UI.title}</h1>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon />
            {LAB_UI.add}
          </Button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder={LAB_UI.filter_status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{LAB_UI.filter_all}</SelectItem>
            {STATUSES.map((key) => (
              <SelectItem key={key} value={key}>
                {LAB_STATUS_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canWrite && staff && (
          <Select value={techId} onValueChange={setTechId}>
            <SelectTrigger size="sm" className="w-52">
              <SelectValue placeholder={LAB_UI.filter_tech} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{LAB_UI.filter_all}</SelectItem>
              {staff.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : orders?.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon="🦷" text={LAB_UI.empty} />
        </Card>
      ) : (
        <div className="space-y-2">
          {orders?.map((order) => (
            <Card key={order.id} className={cn('gap-2 p-3', statusTone(order))}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{order.fio}</span>
                    <Badge variant="secondary">{LAB_STATUS_LABELS[order.status]}</Badge>
                    {order.overdue && <Badge variant="destructive">{LAB_UI.overdue}</Badge>}
                    {order.returns > 0 && (
                      <Badge variant="outline">{LAB_UI.returns(order.returns)}</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-sm">
                    {LAB_WORK_TYPE_LABELS[order.workType]} · {LAB_MATERIAL_LABELS[order.material]}
                    {order.shade ? ` · ${order.shade}` : ''} · {order.teeth.join(', ')}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {LAB_UI.due}: {formatDate(order.dueDate)} · {LAB_UI.tech}:{' '}
                    {order.techName || LAB_UI.tech_none}
                    {order.techPrice !== undefined && ` · ${formatSom(order.techPrice)}`}
                  </div>
                  {order.note && <div className="mt-1 text-sm">{order.note}</div>}
                  {order.returnReason && (
                    <div className="text-xs">
                      {LAB_UI.returned_at}: {LAB_RETURN_REASON_LABELS[order.returnReason]}
                      {order.returnNote ? ` — ${order.returnNote}` : ''}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {order.status === 'issued' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLabStatus({ id: order.id, status: 'ready' })}
                    >
                      {LAB_UI.mark_ready}
                    </Button>
                  )}
                  {order.status === 'ready' && canWrite && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setLabStatus({ id: order.id, status: 'delivered' })}
                      >
                        {LAB_UI.mark_delivered}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReturning(order)}>
                        {LAB_UI.mark_returned}
                      </Button>
                    </>
                  )}
                  {canWrite && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={LAB_UI.edit}
                        onClick={() => {
                          setEditing(order)
                          setFormOpen(true)
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={CARD_UI.delete}
                        onClick={() => setDeleting(order)}
                      >
                        <Trash2Icon />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LabFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editing}
        canSeePrice={hasPermission('lab.cost')}
      />

      <ReturnDialog order={returning} onOpenChange={(open) => !open && setReturning(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{LAB_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{LAB_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await remove(deleting.id)
                setDeleting(null)
              }}
            >
              {CARD_UI.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
