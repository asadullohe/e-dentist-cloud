import { CARD_UI, formatSom, SERVICE_UI } from '@e-dentist/shared'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { type Service, useServices } from '@/entities/service'
import { ServiceFormDialog, useDeleteService } from '@/features/service-form'
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

export function Services() {
  const { data: services, isPending } = useServices()
  const { mutateAsync: remove } = useDeleteService()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)
  const [deleting, setDeleting] = useState<Service | null>(null)

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{SERVICE_UI.title}</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <PlusIcon />
          {SERVICE_UI.add}
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : services?.length === 0 ? (
          <EmptyState icon="🏷" text={SERVICE_UI.empty} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{SERVICE_UI.name}</TableHead>
                <TableHead className="w-40 text-right">{SERVICE_UI.price}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatSom(item.price)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(item)
                        setFormOpen(true)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(item)}>
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editing} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{SERVICE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{SERVICE_UI.delete_text}</AlertDialogDescription>
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
