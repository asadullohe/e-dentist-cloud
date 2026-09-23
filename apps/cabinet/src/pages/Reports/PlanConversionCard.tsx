import { formatSom, REPORT_UI } from '@e-dentist/shared'
import { ClipboardListIcon } from 'lucide-react'
import type { PlanConversion } from '@/entities/report'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

/// Nechta rejadan nechtasi qabul qilindi. Bu klinikaga qaysi shifokor
/// koʻndira olishini koʻrsatadi — raqobatchilarda «sotuv voronkasi»
const rate = (accepted: number, created: number) =>
  created === 0 ? '—' : `${Math.round((accepted / created) * 100)}%`

export function PlanConversionCard({ data }: { data: PlanConversion }) {
  if (data.created === 0) {
    return (
      <Card className="gap-3 overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>{REPORT_UI.plans_title}</CardTitle>
        </CardHeader>
        <EmptyState icon={ClipboardListIcon} text={REPORT_UI.empty_plans} />
      </Card>
    )
  }

  return (
    <Card className="gap-3 overflow-hidden pb-0">
      <CardHeader>
        <CardTitle>{REPORT_UI.plans_title}</CardTitle>
        <p className="text-muted-foreground text-sm">{REPORT_UI.plans_hint}</p>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: REPORT_UI.plans_created, value: String(data.created) },
          { label: REPORT_UI.plans_accepted, value: String(data.accepted) },
          { label: REPORT_UI.plans_rate, value: rate(data.accepted, data.created) },
          { label: REPORT_UI.plans_sum, value: formatSom(data.acceptedTotal) },
        ].map((cell) => (
          <div key={cell.label}>
            <div className="text-muted-foreground text-xs">{cell.label}</div>
            <div className="text-lg font-semibold tabular-nums">{cell.value}</div>
          </div>
        ))}
      </CardContent>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{REPORT_UI.plans_doctor}</TableHead>
            <TableHead className="w-24 text-right">{REPORT_UI.plans_created}</TableHead>
            <TableHead className="hidden w-24 text-right sm:table-cell">
              {REPORT_UI.plans_accepted}
            </TableHead>
            <TableHead className="w-20 text-right">{REPORT_UI.plans_rate}</TableHead>
            <TableHead className="text-right sm:w-40">{REPORT_UI.total}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.byDoctor.map((row) => (
            <TableRow key={row.doctorId}>
              <TableCell className="font-medium whitespace-normal">{row.doctorName}</TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {row.created}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                {row.accepted}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {rate(row.accepted, row.created)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatSom(row.acceptedTotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
