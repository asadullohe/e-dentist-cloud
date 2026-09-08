import { age, CARD_UI, formatDate, formatSom, formatUzPhone } from '@e-dentist/shared'
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePatient } from '@/entities/patient'
import { ToothChart, useToothChart } from '@/entities/tooth'
import { useVisits, type Visit } from '@/entities/visit'
import { PatientFormDialog } from '@/features/patient-form'
import { ToothEditDialog } from '@/features/tooth-edit'
import { useDeleteVisit, VisitFormDialog } from '@/features/visit-form'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui'

function VisitsTab({ patientId }: { patientId: string }) {
  const { data: visits, isPending } = useVisits(patientId)
  const { mutateAsync: removeVisit } = useDeleteVisit()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Visit | undefined>(undefined)
  const [deleting, setDeleting] = useState<Visit | null>(null)

  const total = visits?.reduce((sum, visit) => sum + visit.price, 0) ?? 0

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(visit: Visit) {
    setEditing(visit)
    setFormOpen(true)
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {CARD_UI.total}: <span className="text-foreground font-semibold">{formatSom(total)}</span>
        </div>
        <Button size="sm" onClick={openNew}>
          <PlusIcon />
          {CARD_UI.add_visit}
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        {isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : visits?.length === 0 ? (
          <EmptyState icon="🗓" text={CARD_UI.no_visits} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{CARD_UI.date}</TableHead>
                <TableHead>{CARD_UI.treatment}</TableHead>
                <TableHead className="w-16">{CARD_UI.tooth}</TableHead>
                <TableHead className="w-36 text-right">{CARD_UI.price}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits?.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="tabular-nums">
                    {formatDate(visit.date.slice(0, 10))}
                  </TableCell>
                  <TableCell>
                    {visit.treatment}
                    {visit.note && (
                      <div className="text-muted-foreground text-xs">{visit.note}</div>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{visit.tooth ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSom(visit.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(visit)}>
                      <PencilIcon />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(visit)}>
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <VisitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        visit={editing}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CARD_UI.delete_visit_title}</AlertDialogTitle>
            <AlertDialogDescription>{CARD_UI.delete_visit_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting) await removeVisit(deleting.id)
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

function ChartTab({ patientId }: { patientId: string }) {
  const { data: chart, isPending } = useToothChart(patientId)
  const [picked, setPicked] = useState<number | null>(null)

  if (isPending) return <Skeleton className="h-72 w-full" />

  return (
    <>
      <Card className="p-4">
        <ToothChart teeth={chart?.teeth ?? []} bridges={chart?.bridges ?? []} onPick={setPicked} />
      </Card>

      <ToothEditDialog
        patientId={patientId}
        tooth={picked}
        current={chart?.teeth.find((t) => t.tooth === picked)}
        onClose={() => setPicked(null)}
      />
    </>
  )
}

export function PatientCard() {
  const { id = '' } = useParams()
  const { data: patient, isPending } = usePatient(id)
  const [editOpen, setEditOpen] = useState(false)

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  const years = patient?.birthDate ? age(patient.birthDate.slice(0, 10)) : null

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
        <Link to="/patients">
          <ArrowLeftIcon />
          {CARD_UI.back}
        </Link>
      </Button>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{patient?.fio}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {patient?.phone ? formatUzPhone(patient.phone) : CARD_UI.no_phone}
            {years !== null && ` · ${CARD_UI.age_years(years)}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <PencilIcon />
          {CARD_UI.edit}
        </Button>
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">{CARD_UI.tab_visits}</TabsTrigger>
          <TabsTrigger value="chart">{CARD_UI.tab_chart}</TabsTrigger>
        </TabsList>
        <TabsContent value="visits" className="mt-3">
          <VisitsTab patientId={id} />
        </TabsContent>
        <TabsContent value="chart" className="mt-3">
          <ChartTab patientId={id} />
        </TabsContent>
      </Tabs>

      <PatientFormDialog open={editOpen} onOpenChange={setEditOpen} patient={patient} />
    </>
  )
}
