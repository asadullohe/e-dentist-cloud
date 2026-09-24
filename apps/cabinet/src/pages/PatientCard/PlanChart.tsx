import { PLAN_UI } from '@e-dentist/shared'
import { bridgeSpan } from '@e-dentist/teeth'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Plan } from '@/entities/plan'
import { ToothChart, useToothChart } from '@/entities/tooth'
import {
  Button,
  Card,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/shared/ui'

/// Yigʻilgan-yoyilgani brauzerda eslab qolinadi: telefonda sukut yopiq
/// (bosqichlar darhol koʻrinsin), kompyuterda ochiq
const OPEN_KEY = 'ed:plan-chart-open'

function initialOpen(): boolean {
  try {
    const saved = localStorage.getItem(OPEN_KEY)
    if (saved !== null) return saved === '1'
  } catch {
    // Shaxsiy oynada localStorage yopiq boʻlishi mumkin — sukut qoladi
  }
  return window.matchMedia('(min-width: 640px)').matches
}

interface PlanChartProps {
  plan: Plan
  /// Tahrirlash mumkin boʻlmasa xarita faqat koʻrsatadi
  editable: boolean
  onPickTooth(stageId: string, tooth: number): void
  onPickSpan(stageId: string, from: number, to: number): void
}

/// Xaritadan ishlash (15.3): shifokor bemorning haqiqiy tishlarini koʻrib
/// turib ish qoʻshadi — Dentrix va Open Dental ning asosiy oqimi. Rejadagi
/// tishlar xarita ustida belgilanadi
export function PlanChart({ plan, editable, onPickTooth, onPickSpan }: PlanChartProps) {
  const { data: chart, isPending } = useToothChart(plan.patientId)
  const [open, setOpen] = useState(initialOpen)
  const [spanMode, setSpanMode] = useState(false)
  /// Koʻprik rejimida birinchi bosilgan tish; ikkinchisi oraliqni yopadi
  const [first, setFirst] = useState<number | null>(null)
  const [stageId, setStageId] = useState('')

  // Bosqich oʻchirilgan yoki hali tanlanmagan — oxirgisiga tushadi: yangi
  // ish odatda rejaning oxiriga qoʻshiladi
  const known = plan.stages.some((stage) => stage.id === stageId)
  const target = known ? stageId : (plan.stages[plan.stages.length - 1]?.id ?? '')

  useEffect(() => {
    if (!open) {
      setSpanMode(false)
      setFirst(null)
    }
  }, [open])

  function toggle(next: boolean) {
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, next ? '1' : '0')
    } catch {
      // Yozib boʻlmasa ham sahifa ishlaydi — faqat keyingi safar eslanmaydi
    }
  }

  function pick(tooth: number) {
    if (!target) return
    if (!spanMode) return onPickTooth(target, tooth)

    if (first === null) return setFirst(tooth)
    // Ikkala tish bitta jagʻda boʻlishi shart — boʻlmasa yangisi birinchi
    // boʻlib qoladi, foydalanuvchi xatoni oʻzi koʻradi
    if (bridgeSpan(first, tooth).length < 2) return setFirst(tooth)
    onPickSpan(target, first, tooth)
    setFirst(null)
    setSpanMode(false)
  }

  // Rejadagi tishlar — bandlardan. Koʻprik birliklari ham shu yerda
  const planned = [
    ...new Set(
      plan.stages.flatMap((stage) =>
        stage.items.flatMap((item) => (item.tooth === null ? [] : [item.tooth])),
      ),
    ),
  ]

  return (
    <Card className="mb-3 gap-2 p-3">
      <button
        type="button"
        onClick={() => toggle(!open)}
        className="flex items-center gap-1.5 text-left text-sm font-medium"
      >
        {open ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="text-muted-foreground size-4" />
        )}
        {PLAN_UI.chart_title}
        {!open && planned.length > 0 && (
          <span className="text-muted-foreground font-normal">
            · {PLAN_UI.chart_planned(planned.length)}
          </span>
        )}
      </button>

      {open && (
        <>
          {editable && plan.stages.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Koʻprik rejimi: ikki tish bosiladi, oraliq oʻzi yopiladi */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={spanMode ? 'ghost' : 'secondary'}
                  onClick={() => {
                    setSpanMode(false)
                    setFirst(null)
                  }}
                >
                  {PLAN_UI.chart_mode_tooth}
                </Button>
                <Button
                  size="sm"
                  variant={spanMode ? 'secondary' : 'ghost'}
                  onClick={() => setSpanMode(true)}
                >
                  {PLAN_UI.chart_mode_span}
                </Button>
              </div>

              {plan.stages.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="plan-chart-stage" className="text-muted-foreground text-xs">
                    {PLAN_UI.chart_stage}
                  </Label>
                  <Select value={target} onValueChange={setStageId}>
                    <SelectTrigger id="plan-chart-stage" size="sm" className="max-w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plan.stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ToothChart
              teeth={chart?.teeth ?? []}
              bridges={chart?.bridges ?? []}
              highlight={first === null ? planned : [...planned, first]}
              bare
              onPick={editable && target ? pick : undefined}
            />
          )}

          <p className="text-muted-foreground text-center text-xs">
            {!editable
              ? PLAN_UI.chart_hint_read
              : plan.stages.length === 0
                ? PLAN_UI.chart_hint_no_stage
                : spanMode
                  ? first === null
                    ? PLAN_UI.chart_hint_span_first
                    : PLAN_UI.chart_hint_span_second(first)
                  : PLAN_UI.chart_hint_tooth}
          </p>
        </>
      )}
    </Card>
  )
}
