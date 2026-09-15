import { formatDate, formatSom, PAYROLL_UI } from '@e-dentist/shared'
import { Link } from 'react-router-dom'
import { usePayrollVisits } from '@/entities/payroll'
import { useHasPermission } from '@/entities/session'
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

interface WorksTableProps {
  month: string
  /// Boʻsh — soʻrovchining oʻzi (payroll.own)
  userId: string | null
}

/// Xodimning oydagi ishlari: sana · bemor · muolaja · tish · narx · ulush.
/// Shifokor nimadan qancha topganini koʻradi — hisob «qora quti» boʻlmasin
export function WorksTable({ month, userId }: WorksTableProps) {
  const { data, isPending } = usePayrollVisits(month, userId, true)
  const hasPermission = useHasPermission()
  const canOpenPatient = hasPermission('patients.read')

  if (isPending) return <Skeleton className="h-24 w-full" />
  if (!data || data.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-6 text-center text-sm">
        {PAYROLL_UI.works_empty}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">{PAYROLL_UI.date}</TableHead>
          <TableHead>{PAYROLL_UI.patient}</TableHead>
          <TableHead>{PAYROLL_UI.treatment}</TableHead>
          <TableHead className="w-16">{PAYROLL_UI.tooth}</TableHead>
          <TableHead className="w-36 text-right">{PAYROLL_UI.price}</TableHead>
          <TableHead className="w-36 text-right">{PAYROLL_UI.share}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="tabular-nums">{formatDate(row.date.slice(0, 10))}</TableCell>
            <TableCell className="font-medium">
              {canOpenPatient ? (
                <Link to={`/patients/${row.patientId}`} className="hover:underline">
                  {row.patientName}
                </Link>
              ) : (
                row.patientName
              )}
            </TableCell>
            <TableCell>{row.treatment}</TableCell>
            <TableCell className="tabular-nums">{row.tooth ?? '—'}</TableCell>
            <TableCell className="text-right tabular-nums">{formatSom(row.price)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSom(row.share)}
              <span className="text-muted-foreground ml-1 text-xs">{row.percent}%</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
