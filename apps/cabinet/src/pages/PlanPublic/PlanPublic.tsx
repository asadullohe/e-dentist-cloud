import {
  formatDate,
  formatSom,
  formatUzPhone,
  PLAN_PUBLIC_UI,
  PLAN_UI,
  planLogoUrl,
} from '@e-dentist/shared'
import { cn } from 'cn'
import { CheckCircle2Icon, PhoneIcon } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { type PlanPublic as PlanPublicData, usePublicPlan } from '@/entities/plan'
import { ToothChart } from '@/entities/tooth'
import { Button, Card, Skeleton } from '@/shared/ui'
import { PublicShell } from '@/widgets/public-shell'
import { RespondForm } from './RespondForm'

/// Bemor javob berib boʻlgach yoki reja allaqachon hal boʻlgan boʻlsa —
/// qisqa xabar. Rejaning oʻzi baribir tepada koʻrinib turadi
function statusNote(plan: PlanPublicData): string | null {
  if (plan.expired) return PLAN_PUBLIC_UI.expired
  if (plan.status === 'accepted') return PLAN_PUBLIC_UI.already_accepted
  if (plan.status === 'declined') return PLAN_PUBLIC_UI.already_declined
  if (plan.status === 'done') return PLAN_PUBLIC_UI.already_done
  return null
}

/// Davolash rejasining ochiq sahifasi: /r/<kod>. Bemor telefonida ochadi,
/// ishlarni va narxni koʻradi, roziligini bildiradi (tz.md 18-boʻlim)
export function PlanPublic() {
  const { code = '' } = useParams()
  const { data: plan, isPending, isError } = usePublicPlan(code)
  /// null — tanlov qilinmagan; true/false — rozilik yoki bosh tortish formasi
  const [answering, setAnswering] = useState<boolean | null>(null)
  const [answered, setAnswered] = useState<boolean | null>(null)

  if (isPending) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">{PLAN_PUBLIC_UI.not_found}</p>
      </main>
    )
  }

  if (answered !== null) {
    return (
      <PublicShell
        logoUrl={planLogoUrl(code)}
        clinicName={plan.clinicName}
        hasLogo={plan.hasLogo}
        title={PLAN_PUBLIC_UI.title}
      >
        <Card className="items-center gap-3 p-6 text-center">
          <CheckCircle2Icon className="text-ok size-10" aria-hidden="true" />
          <p className="font-medium">
            {answered ? PLAN_PUBLIC_UI.thanks_accept : PLAN_PUBLIC_UI.thanks_decline}
          </p>
          {plan.publicPhone && (
            <Button variant="outline" asChild>
              <a href={`tel:${plan.publicPhone}`}>
                <PhoneIcon />
                {formatUzPhone(plan.publicPhone)}
              </a>
            </Button>
          )}
        </Card>
      </PublicShell>
    )
  }

  const note = statusNote(plan)

  return (
    <PublicShell
      logoUrl={planLogoUrl(code)}
      clinicName={plan.clinicName}
      hasLogo={plan.hasLogo}
      title={plan.title}
      subtitle={`${PLAN_PUBLIC_UI.doctor}: ${plan.doctorName}`}
    >
      <p className="text-muted-foreground -mt-3 mb-4 text-sm">
        {PLAN_PUBLIC_UI.patient}: {plan.patientName}
      </p>

      {plan.teeth.length > 0 && (
        <Card className="mb-3 gap-2 p-3">
          <div className="text-muted-foreground text-xs">{PLAN_PUBLIC_UI.teeth_title}</div>
          {/* Koʻprik chizigʻi rejadagi guruhlardan (15.2): bemor qaysi
              tishlar birga bogʻlanishini koʻradi */}
          <ToothChart
            teeth={[]}
            bridges={plan.stages.flatMap((stage) =>
              stage.groups.map((group) => ({ id: group.id, teeth: group.teeth })),
            )}
            highlight={plan.teeth}
            bare
          />
        </Card>
      )}

      <div className="space-y-3">
        {plan.stages.map((stage) => (
          <Card key={stage.name} className="gap-2 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{stage.name}</span>
              <span className="text-muted-foreground text-sm tabular-nums">
                {formatSom(stage.total)}
              </span>
            </div>
            {stage.note && <p className="text-muted-foreground text-xs">{stage.note}</p>}
            <div className="space-y-1">
              {stage.items.map((item, index) => {
                const group = stage.groups.find((row) => row.id === item.groupId)
                // Koʻprik bemorga ham bitta blok: sarlavha birinchi
                // bandidan oldin, ichidagilar surilgan (15.2)
                const first = group !== undefined && stage.items[index - 1]?.groupId !== group.id
                return (
                  <div key={`${stage.name}-${item.treatment}-${item.tooth}`}>
                    {first && group && (
                      <div className="text-muted-foreground mt-1.5 text-xs font-medium">
                        {group.name}
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex items-baseline justify-between gap-2 text-sm',
                        group && 'pl-2',
                      )}
                    >
                      <span>
                        {item.tooth !== null && (
                          <span className="bg-muted mr-1.5 rounded px-1.5 py-0.5 text-xs tabular-nums">
                            {item.tooth}
                          </span>
                        )}
                        {item.treatment}
                        {group && item.tooth !== null && (
                          <span className="text-muted-foreground text-xs">
                            {' '}
                            ·{' '}
                            {group.pontics.includes(item.tooth)
                              ? PLAN_UI.role_pontic
                              : PLAN_UI.role_abutment}
                          </span>
                        )}
                        {item.qty > 1 && (
                          <span className="text-muted-foreground text-xs"> × {item.qty}</span>
                        )}
                      </span>
                      <span className="tabular-nums">{formatSom(item.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-3 gap-1 p-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{PLAN_UI.total}</span>
          <span className="tabular-nums">{formatSom(plan.total)}</span>
        </div>
        {plan.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{PLAN_UI.discount}</span>
            <span className="tabular-nums">−{formatSom(plan.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold">
          <span>{PLAN_UI.payable}</span>
          <span className="tabular-nums">{formatSom(plan.payable)}</span>
        </div>
        {plan.validUntil && (
          <div className="text-muted-foreground mt-1 text-xs">
            {PLAN_PUBLIC_UI.valid_until}: {formatDate(plan.validUntil)}
          </div>
        )}
      </Card>

      <div className="mt-4">
        {answering !== null ? (
          <RespondForm
            code={code}
            accept={answering}
            needsPhone={plan.needsPhone}
            onCancel={() => setAnswering(null)}
            onDone={setAnswered}
          />
        ) : plan.canRespond ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAnswering(false)}>
              {PLAN_PUBLIC_UI.decline}
            </Button>
            <Button className="flex-1" onClick={() => setAnswering(true)}>
              {PLAN_PUBLIC_UI.accept}
            </Button>
          </div>
        ) : (
          note && (
            <Card className="items-center gap-3 p-4 text-center">
              <p className="text-muted-foreground text-sm">{note}</p>
              {plan.publicPhone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${plan.publicPhone}`}>
                    <PhoneIcon />
                    {PLAN_PUBLIC_UI.call}
                  </a>
                </Button>
              )}
            </Card>
          )
        )}
      </div>
    </PublicShell>
  )
}
