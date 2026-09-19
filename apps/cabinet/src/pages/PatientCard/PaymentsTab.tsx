import { formatSom, PAYMENT_UI } from '@e-dentist/shared'
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { cn } from 'cn'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { type Payment, useBalance, usePayments } from '@/entities/payment'
import { useHasPermission } from '@/entities/session'
import { CancelPaymentDialog, PaymentFormDialog } from '@/features/payment-form'
import { Button, DataTable, DataTablePagination } from '@/shared/ui'
import { paymentColumns } from './paymentColumns'

function BalanceRow({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('font-semibold tabular-nums', tone)}>{formatSom(value)}</span>
    </div>
  )
}

export function PaymentsTab({ patientId }: { patientId: string }) {
  // Bitta bemorning toʻlovlari toʻliq keladi — saralash va sahifalash mijozda
  const { data: payments, isPending } = usePayments(patientId)
  const { data: balance } = useBalance(patientId)
  const hasPermission = useHasPermission()
  const canWrite = hasPermission('payments.write')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | undefined>(undefined)
  // Oʻchirish yoʻq — bekor qilish, sabab bilan
  const [cancelling, setCancelling] = useState<Payment | null>(null)

  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data: payments ?? [],
    columns: paymentColumns({
      onEdit: (payment) => {
        setEditing(payment)
        setFormOpen(true)
      },
      onCancel: setCancelling,
      canEdit: canWrite,
    }),
    state: { sorting, columnVisibility, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const debt = balance?.debt ?? 0

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-6">
          <BalanceRow label={PAYMENT_UI.charges} value={balance?.charges ?? 0} />
          <BalanceRow label={PAYMENT_UI.paid} value={balance?.paid ?? 0} />
          <BalanceRow
            // Manfiy qarz — bemor oldindan toʻlagan, bu yaxshi holat
            label={debt < 0 ? PAYMENT_UI.prepaid : PAYMENT_UI.debt}
            value={Math.abs(debt)}
            tone={debt > 0 ? 'text-destructive' : debt < 0 ? 'text-ok' : undefined}
          />
        </div>
        {/* Kuzatuvchi (payments.read) koʻradi, lekin qabul qilmaydi */}
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <PlusIcon />
            {PAYMENT_UI.add}
          </Button>
        )}
      </div>

      <DataTable table={table} loading={isPending && !payments} emptyText={PAYMENT_UI.empty} />

      {(payments?.length ?? 0) > 0 && (
        <div className="mt-3">
          <DataTablePagination table={table} />
        </div>
      )}

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        payment={editing}
      />

      <CancelPaymentDialog payment={cancelling} onClose={() => setCancelling(null)} />
    </>
  )
}
