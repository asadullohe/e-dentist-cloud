import {
  formatDate,
  formatSom,
  LAB_MATERIAL_LABELS,
  LAB_STATUS_LABELS,
  LAB_UI,
  LAB_WORK_TYPE_LABELS,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { useLabOrders } from '@/entities/lab-order'
import { Badge, Card, EmptyState, Skeleton } from '@/shared/ui'

/// Shu bemorga qilingan barcha naryadlar (tz.md 7-boʻlim). Bu yerda faqat
/// koʻrsatiladi — yozish va holat oʻzgartirish «Texnik ishlari» sahifasida
export function LabTab({ patientId }: { patientId: string }) {
  const { data: orders, isPending } = useLabOrders({ patientId })

  if (isPending) return <Skeleton className="h-24 w-full" />

  if (orders?.length === 0) {
    return (
      <Card className="py-0">
        <EmptyState icon="🦷" text={LAB_UI.empty_patient} />
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {orders?.map((order) => (
        <Card
          key={order.id}
          className={cn(
            'gap-1 p-3',
            order.status === 'delivered' && 'bg-ok/10',
            order.overdue && 'bg-destructive/10',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{LAB_WORK_TYPE_LABELS[order.workType]}</span>
            <Badge variant="secondary">{LAB_STATUS_LABELS[order.status]}</Badge>
            {order.overdue && <Badge variant="destructive">{LAB_UI.overdue}</Badge>}
            {order.returns > 0 && <Badge variant="outline">{LAB_UI.returns(order.returns)}</Badge>}
          </div>
          <div className="text-muted-foreground text-sm">
            {LAB_MATERIAL_LABELS[order.material]}
            {order.shade ? ` · ${order.shade}` : ''} · {order.teeth.join(', ')}
          </div>
          <div className="text-muted-foreground text-xs">
            {LAB_UI.due}: {formatDate(order.dueDate)} · {LAB_UI.tech}:{' '}
            {order.techName || LAB_UI.tech_none}
            {order.techPrice !== undefined && ` · ${formatSom(order.techPrice)}`}
          </div>
        </Card>
      ))}
    </div>
  )
}
