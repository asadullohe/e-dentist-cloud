import {
  clinicLogoUrl,
  formatDate,
  formatSom,
  formatUzPhone,
  PLAN_PRINT_UI,
  PLAN_UI,
  todayISO,
} from '@e-dentist/shared'
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react'
import { Fragment } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlan } from '@/entities/plan'
import { useSession } from '@/entities/session'
import { Button, Skeleton } from '@/shared/ui'

/// Rejaning A4 varagʻi: shartnomaga ilova qilinadi va imzolanadi. Yon
/// menyusiz alohida sahifa — brauzerning «Chop etish» oynasi shu sahifani
/// chiqaradi (navbat varagʻidagi kabi, 10.8). Ranglar ataylab qotirilgan:
/// varaq qorongʻi rejimda ham oq
export function PlanPrint() {
  const { id = '', planId = '' } = useParams()
  const { data: plan, isPending } = usePlan(planId)
  const { data: session } = useSession()
  const clinic = session?.clinic

  if (isPending || !plan || !clinic) return <Skeleton className="m-8 h-96" />

  // Bandlar butun varaq boʻyicha ketma-ket raqamlanadi — bemor «7-ish»
  // deganda ikkalasi bir narsani koʻrsin
  let no = 0

  return (
    <main className="min-h-dvh bg-white text-neutral-900 print:min-h-0">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2 print:hidden">
        <Button asChild variant="ghost" size="sm" className="text-neutral-700">
          <Link to={`/patients/${id}/reja/${planId}`}>
            <ArrowLeftIcon />
            {PLAN_PRINT_UI.back}
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <PrinterIcon />
          {PLAN_PRINT_UI.print}
        </Button>
      </div>

      <section className="mx-auto max-w-[190mm] px-8 py-10 print:px-0 print:py-0">
        <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-4">
          <div className="flex items-center gap-3">
            {clinic.logoKey && (
              <img
                src={clinicLogoUrl(clinic.queueCode)}
                alt=""
                className="size-14 rounded-lg object-contain"
              />
            )}
            <div>
              <div className="text-xl font-bold tracking-tight">{clinic.name}</div>
              <div className="text-sm text-neutral-600">
                {clinic.publicPhone && formatUzPhone(clinic.publicPhone)}
                {clinic.publicPhone && clinic.address && ' · '}
                {clinic.address}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-neutral-600">
            {PLAN_PRINT_UI.date}: {formatDate(todayISO())}
          </div>
        </header>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">{PLAN_PRINT_UI.title}</h1>
        <div className="mt-1 text-sm text-neutral-700">
          {PLAN_PRINT_UI.patient}: <span className="font-medium">{plan.fio}</span>
          {' · '}
          {PLAN_PRINT_UI.doctor}: <span className="font-medium">{plan.doctorName}</span>
        </div>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-400 text-left">
              <th className="w-8 py-1.5 font-semibold">{PLAN_PRINT_UI.col_no}</th>
              <th className="w-12 py-1.5 font-semibold">{PLAN_PRINT_UI.col_tooth}</th>
              <th className="py-1.5 font-semibold">{PLAN_PRINT_UI.col_work}</th>
              <th className="w-14 py-1.5 text-right font-semibold">{PLAN_PRINT_UI.col_qty}</th>
              <th className="w-28 py-1.5 text-right font-semibold">{PLAN_PRINT_UI.col_price}</th>
              <th className="w-32 py-1.5 text-right font-semibold">{PLAN_PRINT_UI.col_total}</th>
            </tr>
          </thead>
          <tbody>
            {plan.stages.map((stage) => (
              <Fragment key={stage.id}>
                {/* Bosqich qatori: fon rangini brauzer sukut boʻyicha chop
                    etmaydi, shuning uchun ajratuvchi chiziq ham bor */}
                <tr className="border-t-2 border-neutral-400 bg-neutral-100">
                  <td colSpan={5} className="py-1.5 pl-1 font-semibold">
                    {stage.name}
                  </td>
                  <td className="py-1.5 pr-1 text-right font-semibold tabular-nums">
                    {formatSom(stage.total)}
                  </td>
                </tr>
                {stage.items.map((item) => {
                  no += 1
                  return (
                    <tr key={item.id} className="border-b border-neutral-200 align-top">
                      <td className="py-1.5 tabular-nums">{no}</td>
                      <td className="py-1.5 tabular-nums">{item.tooth ?? '—'}</td>
                      <td className="py-1.5">{item.treatment}</td>
                      <td className="py-1.5 text-right tabular-nums">{item.qty}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatSom(item.price)}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatSom(item.total)}</td>
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">{PLAN_UI.total}</span>
            <span className="tabular-nums">{formatSom(plan.total)}</span>
          </div>
          {plan.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">{PLAN_UI.discount}</span>
              <span className="tabular-nums">−{formatSom(plan.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-400 pt-1 text-base font-bold">
            <span>{PLAN_UI.payable}</span>
            <span className="tabular-nums">{formatSom(plan.payable)}</span>
          </div>
          {plan.validUntil && (
            <div className="text-xs text-neutral-600">
              {PLAN_UI.valid_until}: {formatDate(plan.validUntil)}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs leading-snug text-neutral-600">{PLAN_PRINT_UI.footnote}</p>

        {/* Imzo joylari — chiziq ustida ism yozilmaydi: qoʻlda qoʻyiladi */}
        <div className="mt-10 flex gap-12">
          {[PLAN_PRINT_UI.sign_doctor, PLAN_PRINT_UI.sign_patient].map((label) => (
            <div key={label} className="flex-1">
              <div className="h-10 border-b border-neutral-400" />
              <div className="mt-1 text-xs text-neutral-600">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
