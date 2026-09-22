import {
  CARD_UI,
  formatDate,
  formatSom,
  PLAN_STATUS_LABELS,
  PLAN_UI,
  TABLE_UI,
} from '@e-dentist/shared'
import {
  CheckIcon,
  ChevronLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SendIcon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { type PlanStatus, usePlan } from '@/entities/plan'
import { useHasPermission } from '@/entities/session'
import { PlanFormDialog, StatusDialog, useSetPlanStatus } from '@/features/plan-form'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@/shared/ui'
import { PlanLink } from './PlanLink'
import { PlanStages } from './PlanStages'

/// Bitta reja: sarlavha, holat amallari, bosqichlar va jamlanma
export function PlanPage() {
  const { id = '', planId = '' } = useParams()
  const { data: plan, isPending, isError } = usePlan(planId)
  const { mutate: setStatus } = useSetPlanStatus(planId)
  const hasPermission = useHasPermission()
  const [formOpen, setFormOpen] = useState(false)
  // Sabab talab qiladigan amallar oynada soʻraladi
  const [asking, setAsking] = useState<PlanStatus | null>(null)

  // Reja yoʻq (oʻchirilgan, begona yoki shifokorga koʻrinmaydi) — roʻyxatga.
  // Busiz sahifa abadiy skeletonda qolardi
  if (isError) return <Navigate to={`/patients/${id}/reja`} replace />
  if (isPending || !plan) return <Skeleton className="h-64 w-full" />

  // Bajarilgan va bekor qilingan reja qotadi — server ham rad etadi
  const locked = plan.status === 'done' || plan.status === 'cancelled'
  const canWrite = hasPermission('plans.write') && !locked

  return (
    <>
      <Link
        to={`/patients/${id}/reja`}
        className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeftIcon className="size-4" />
        {PLAN_UI.back}
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{plan.title}</h2>
            <Badge variant={plan.status === 'accepted' ? 'default' : 'secondary'}>
              {PLAN_STATUS_LABELS[plan.status]}
            </Badge>
            {plan.expired && <Badge variant="destructive">{PLAN_UI.expired}</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {plan.doctorName}
            {plan.validUntil && ` · ${PLAN_UI.valid_until}: ${formatDate(plan.validUntil)}`}
          </p>
          {plan.note && <p className="mt-1 text-sm">{plan.note}</p>}
        </div>

        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <PencilIcon />
              {CARD_UI.edit}
            </Button>

            {(plan.status === 'draft' || plan.status === 'declined') && (
              <Button size="sm" onClick={() => setStatus({ status: 'sent' })}>
                <SendIcon />
                {plan.status === 'declined' ? PLAN_UI.resend : PLAN_UI.send}
              </Button>
            )}
            {plan.status === 'sent' && (
              <>
                <Button size="sm" onClick={() => setStatus({ status: 'accepted' })}>
                  <CheckIcon />
                  {PLAN_UI.accept}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAsking('declined')}>
                  <XIcon />
                  {PLAN_UI.decline}
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={TABLE_UI.actions}>
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onSelect={() => setAsking('cancelled')}>
                  {PLAN_UI.cancel_plan}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {plan.declineReason && (
        <Card className="mb-3 gap-0 p-3 text-sm">
          <span className="text-muted-foreground">{PLAN_UI.decline_title}</span>
          <span>{plan.declineReason}</span>
        </Card>
      )}
      {plan.cancelReason && (
        <Card className="mb-3 gap-0 p-3 text-sm">
          <span className="text-muted-foreground">{PLAN_UI.cancel_title}</span>
          <span>{plan.cancelReason}</span>
        </Card>
      )}

      <PlanStages plan={plan} editable={canWrite} />

      <Card className="mt-4 gap-1 p-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{PLAN_UI.total}</span>
          <span className="tabular-nums">{formatSom(plan.total)}</span>
        </div>
        {plan.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{PLAN_UI.discount}</span>
            <span className="tabular-nums">−{formatSom(plan.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>{PLAN_UI.payable}</span>
          <span className="tabular-nums">{formatSom(plan.payable)}</span>
        </div>
        {plan.itemCount > 0 && (
          <div className="text-muted-foreground mt-1 text-xs">
            {PLAN_UI.items_count(plan.doneCount, plan.itemCount)}
          </div>
        )}
      </Card>

      {/* Havola qoralamada koʻrsatilmaydi: ochiq sahifa uni hali
          bermaydi — avval «Bemorga yuborish» bosiladi */}
      {plan.status !== 'draft' && plan.status !== 'cancelled' && (
        <PlanLink publicCode={plan.publicCode} />
      )}

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} patientId={id} plan={plan} />
      <StatusDialog planId={planId} status={asking} onClose={() => setAsking(null)} />
    </>
  )
}
