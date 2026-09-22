import { formatDate, formatSom, PLAN_STATUS_LABELS, PLAN_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { ClipboardListIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePatient } from '@/entities/patient'
import { type Plan, usePlans } from '@/entities/plan'
import { useHasPermission } from '@/entities/session'
import { PlanFormDialog } from '@/features/plan-form'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/shared/ui'

/// Holat rangi: qabul qilingan — yashil, rad/bekor — oʻchgan, qolgani oddiy
function statusVariant(status: Plan['status']) {
  if (status === 'accepted' || status === 'done') return 'default' as const
  if (status === 'declined' || status === 'cancelled') return 'outline' as const
  return 'secondary' as const
}

/// Shu bemorning rejalari. Bosqichlar va ishlar rejaning oʻz sahifasida
export function PlansTab({ patientId }: { patientId: string }) {
  const { data: plans, isPending } = usePlans(patientId)
  const { data: patient } = usePatient(patientId)
  const hasPermission = useHasPermission()
  const [formOpen, setFormOpen] = useState(false)

  if (isPending) return <Skeleton className="h-24 w-full" />

  const canWrite = hasPermission('plans.write')

  return (
    <>
      {canWrite && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <PlusIcon />
            {PLAN_UI.add}
          </Button>
        </div>
      )}

      {plans?.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={ClipboardListIcon} text={PLAN_UI.empty} />
        </Card>
      ) : (
        <div className="space-y-2">
          {plans?.map((plan) => (
            <Link key={plan.id} to={`/patients/${patientId}/reja/${plan.id}`} className="block">
              <Card
                className={cn(
                  'hover:bg-accent/50 gap-1 p-3 transition-colors',
                  (plan.status === 'cancelled' || plan.status === 'declined') && 'opacity-60',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{plan.title}</span>
                  <Badge variant={statusVariant(plan.status)}>
                    {PLAN_STATUS_LABELS[plan.status]}
                  </Badge>
                  {plan.expired && <Badge variant="destructive">{PLAN_UI.expired}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-semibold tabular-nums">{formatSom(plan.payable)}</span>
                  {plan.discount > 0 && (
                    <span className="text-muted-foreground text-xs line-through tabular-nums">
                      {formatSom(plan.total)}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    · {PLAN_UI.items_count(plan.doneCount, plan.itemCount)}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {plan.doctorName} · {formatDate(plan.createdAt.slice(0, 10))}
                  {plan.validUntil && ` · ${PLAN_UI.valid_until}: ${formatDate(plan.validUntil)}`}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PlanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        defaultDoctorId={patient?.doctorId ?? null}
      />
    </>
  )
}
