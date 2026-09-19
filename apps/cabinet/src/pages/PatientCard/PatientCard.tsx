import {
  age,
  BRIDGE_UI,
  CARD_UI,
  formatUzPhone,
  IMAGE_UI,
  LAB_UI,
  PATIENT_UI,
  PAYMENT_UI,
  QUEUE_CABINET_UI,
} from '@e-dentist/shared'
import { crownMaterialLabel } from '@e-dentist/teeth'
import {
  ArrowLeftIcon,
  BellPlusIcon,
  CalendarIcon,
  CreditCardIcon,
  FlaskConicalIcon,
  ImageIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { usePatient } from '@/entities/patient'
import { useHasPermission } from '@/entities/session'
import { type BridgeInfo, ToothChart, useToothChart } from '@/entities/tooth'
import { BridgeFormDialog, useDeleteBridge } from '@/features/bridge-form'
import { PatientFormDialog } from '@/features/patient-form'
import { EnqueueDialog } from '@/features/queue-manage'
import { ToothEditDialog } from '@/features/tooth-edit'
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
  ContentSection,
  Separator,
  SideNav,
  type SideNavItem,
  SideNavLayout,
  Skeleton,
} from '@/shared/ui'
import { ImagesTab } from './ImagesTab'
import { LabTab } from './LabTab'
import { PaymentsTab } from './PaymentsTab'
import { VisitsTab } from './VisitsTab'

function ChartTab({ patientId }: { patientId: string }) {
  const { data: chart, isPending } = useToothChart(patientId)
  const { mutateAsync: removeBridge } = useDeleteBridge(patientId)
  const hasPermission = useHasPermission()
  // Qabulxona xaritani koʻradi, oʻzgartirmaydi
  const canEdit = hasPermission('teeth.write')
  const [picked, setPicked] = useState<number | null>(null)
  const [bridgeOpen, setBridgeOpen] = useState(false)
  const [deletingBridge, setDeletingBridge] = useState<BridgeInfo | null>(null)

  if (isPending) return <Skeleton className="h-72 w-full" />

  const bridges = chart?.bridges ?? []

  return (
    <>
      {canEdit && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setBridgeOpen(true)}>
            <PlusIcon />
            {BRIDGE_UI.add}
          </Button>
        </div>
      )}

      {/* Telefonda karta ekran chetigacha va deyarli hoshiyasiz — xarita
          kattaroq chiqadi; kompyuterda oddiy karta */}
      <Card className="-mx-4 rounded-none border-x-0 p-1.5 sm:mx-0 sm:rounded-xl sm:border-x sm:p-4">
        <ToothChart
          teeth={chart?.teeth ?? []}
          bridges={bridges}
          onPick={canEdit ? setPicked : undefined}
        />
      </Card>

      {bridges.length > 0 && (
        <div className="mt-3">
          <div className="text-muted-foreground mb-1.5 text-sm">{BRIDGE_UI.existing}</div>
          <div className="flex flex-wrap gap-2">
            {bridges.map((bridge) => (
              <div
                key={bridge.id}
                className="flex items-center gap-2 rounded-md border py-1 pr-1 pl-2.5 text-sm"
              >
                <span className="tabular-nums">
                  {bridge.teeth[0]}–{bridge.teeth[bridge.teeth.length - 1]}
                </span>
                <span className="text-muted-foreground text-xs">
                  {crownMaterialLabel(bridge.material)}
                </span>
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => setDeletingBridge(bridge)}>
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ToothEditDialog
        patientId={patientId}
        tooth={picked}
        current={chart?.teeth.find((t) => t.tooth === picked)}
        onClose={() => setPicked(null)}
      />

      <BridgeFormDialog
        open={bridgeOpen}
        onOpenChange={setBridgeOpen}
        patientId={patientId}
        teeth={chart?.teeth ?? []}
      />

      <AlertDialog
        open={deletingBridge !== null}
        onOpenChange={(open) => !open && setDeletingBridge(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{BRIDGE_UI.delete_title}</AlertDialogTitle>
            <AlertDialogDescription>{BRIDGE_UI.delete_text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CARD_UI.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingBridge) await removeBridge(deletingBridge.id)
                setDeletingBridge(null)
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

/// Kartochka boʻlimlari. Funksiya — matnlar joriy tilda oʻqilishi uchun.
/// Ruxsatga bogʻliq boʻlimlar (toʻlovlar, texnik) roʻyxatga kirmaydi —
/// shifokor «Toʻlovlar» ni koʻrmaydi, haqiqiy himoya serverda
function cardItems(id: string, can: { payments: boolean; lab: boolean }): SideNavItem[] {
  const base = `/patients/${id}`
  const items: SideNavItem[] = [
    { to: base, label: CARD_UI.tab_visits, icon: CalendarIcon },
    { to: `${base}/tishlar`, label: CARD_UI.tab_chart, icon: LayoutGridIcon },
  ]
  if (can.payments) {
    items.push({ to: `${base}/tolovlar`, label: PAYMENT_UI.tab, icon: CreditCardIcon })
  }
  items.push({ to: `${base}/rasmlar`, label: IMAGE_UI.tab, icon: ImageIcon })
  if (can.lab) items.push({ to: `${base}/texnik`, label: LAB_UI.tab, icon: FlaskConicalIcon })
  return items
}

// Boʻlimlar — har biri oʻz manzilida (router.tsx). Bemor id si marshrutdan

export function VisitsSection() {
  const { id = '' } = useParams()
  return (
    <ContentSection title={CARD_UI.tab_visits} desc={CARD_UI.visits_hint} wide>
      <VisitsTab patientId={id} />
    </ContentSection>
  )
}

export function ChartSection() {
  const { id = '' } = useParams()
  return (
    <ContentSection title={CARD_UI.tab_chart} desc={CARD_UI.chart_hint} wide>
      <ChartTab patientId={id} />
    </ContentSection>
  )
}

export function PaymentsSection() {
  const { id = '' } = useParams()
  return (
    <ContentSection title={PAYMENT_UI.tab} desc={CARD_UI.payments_hint} wide>
      <PaymentsTab patientId={id} />
    </ContentSection>
  )
}

export function ImagesSection() {
  const { id = '' } = useParams()
  return (
    <ContentSection title={IMAGE_UI.tab} desc={CARD_UI.images_hint} wide>
      <ImagesTab patientId={id} />
    </ContentSection>
  )
}

export function LabSection() {
  const { id = '' } = useParams()
  return (
    <ContentSection title={LAB_UI.tab} desc={CARD_UI.lab_hint} wide>
      <LabTab patientId={id} />
    </ContentSection>
  )
}

export function PatientCard() {
  const { id = '' } = useParams()
  const { data: patient, isPending } = usePatient(id)
  const hasPermission = useHasPermission()
  const [editOpen, setEditOpen] = useState(false)
  const [enqueueOpen, setEnqueueOpen] = useState(false)

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

      {/* Telefonda tugmalar ism ostiga tushadi — kesilib qolmasin */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{patient?.fio}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {patient?.phone ? formatUzPhone(patient.phone) : CARD_UI.no_phone}
            {years !== null && ` · ${CARD_UI.age_years(years)}`}
            {patient?.doctorName && ` · ${PATIENT_UI.doctor}: ${patient.doctorName}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission('queue.manage') && (
            <Button variant="outline" size="sm" onClick={() => setEnqueueOpen(true)}>
              <BellPlusIcon />
              {QUEUE_CABINET_UI.enqueue}
            </Button>
          )}
          {hasPermission('patients.write') && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon />
              {CARD_UI.edit}
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-4 hidden lg:block" />
      <SideNavLayout
        nav={
          <SideNav
            items={cardItems(id, {
              payments: hasPermission('payments.read'),
              lab: hasPermission('lab.write'),
            })}
          />
        }
      >
        <Outlet />
      </SideNavLayout>

      <PatientFormDialog open={editOpen} onOpenChange={setEditOpen} patient={patient} />
      <EnqueueDialog
        patient={enqueueOpen && patient ? patient : null}
        onClose={() => setEnqueueOpen(false)}
      />
    </>
  )
}
