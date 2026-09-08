import { CARD_UI, formatDate, formatSom, PAYMENT_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { type Payment, useBalance, usePayments } from '@/entities/payment'
import { PaymentFormDialog, useDeletePayment } from '@/features/payment-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'

function BalanceRow({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('font-semibold tabular-nums', tone)}>{formatSom(value)}</span>
    </div>
  )
}

export function PaymentsTab({ patientId }: { patientId: string }) {
  const { data: payments, isPending } = usePayments(patientId)
  const { data: balance } = useBalance(patientId)
  const { mutateAsync: remove } = useDeletePayment()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | undefined>(undefined)
  const [deleting, setDeleting] = useState<Payment | null>(null)

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
      </div>

      <Card className="overflow-hidden py-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : payments?.length === 0 ? (
          <EmptyState icon="💳" text={PAYMENT_UI.empty} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{PAYMENT_UI.date}</TableHead>
                <TableHead>{PAYMENT_UI.note}</TableHead>
                <TableHead className="w-36 text-right">{PAYMENT_UI.amount}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="tabular-nums">
                    {formatDate(payment.date.slice(0, 10))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.note ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatSom(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(payment)
                        setFormOpen(true)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(payment)}>
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PaymentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        payment={editing}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{PAYMENT_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{PAYMENT_UI.delete_text}</AlertDialogDescription>
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
