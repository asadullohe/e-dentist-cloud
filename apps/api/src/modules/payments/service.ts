// Toʻlovlar va qarzdorlik.
//
// Qarz alohida ustunda saqlanmaydi: u tashriflar va toʻlovlar farqidan
// hisoblanadi. Ikki joyda turgan son ertami-kechmi bir-biridan ajralib
// qoladi (tz.md 5-boʻlim).

import { PATIENT_TEXT, PAYMENT_TEXT } from '@e-dentist/shared'
import { AUDIT_ACTION, writeAudit } from '../../platform/audit.js'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { type ClinicTx, withClinic } from '../../platform/tenant.js'
import { uuidV7 } from '../../platform/uuid.js'
import * as patients from '../patients/service.js'
import * as visits from '../visits/service.js'
import * as repo from './repo.js'
import type { DebtorsInput, PaymentCreateInput, PaymentUpdateInput } from './schema.js'

export interface PaymentDeps {
  db: Db
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`)
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2025'
  )
}

async function assertPatient(tx: ClinicTx, patientId: string): Promise<void> {
  if (!(await patients.existsInClinic(tx, patientId))) {
    throw errors.notFound(PATIENT_TEXT.not_found)
  }
}

export function list(deps: PaymentDeps, clinicId: string, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)
    return repo.list(tx, patientId)
  })
}

/// Boshqa modullar uchun (reports): kun boʻyicha tushum
export async function dailyTotalsTx(
  tx: ClinicTx,
  from: Date,
  to: Date,
): Promise<{ date: Date; total: number }[]> {
  const rows = await repo.dailyTotals(tx, from, to)
  return rows.map((row) => ({ date: row.date, total: row._sum.amount ?? 0 }))
}

/// Bemorning hisobi. Qarz manfiy boʻlsa — oldindan toʻlangan
export function balance(deps: PaymentDeps, clinicId: string, patientId: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, patientId)
    const [charges, paid] = await Promise.all([
      visits.chargeTotalOf(tx, patientId),
      repo.paidTotalOf(tx, patientId),
    ])
    return { charges, paid, debt: charges - paid }
  })
}

export function create(
  deps: PaymentDeps,
  clinicId: string,
  userId: string,
  input: PaymentCreateInput,
) {
  const id = uuidV7()
  return withClinic(deps.db, clinicId, async (tx) => {
    await assertPatient(tx, input.patientId)

    const payment = await repo.create(tx, id, {
      patientId: input.patientId,
      date: toDate(input.date),
      amount: input.amount,
      note: input.note ?? null,
    })
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.payment_created,
      entity: 'payment',
      entityId: id,
      meta: { patientId: input.patientId, amount: input.amount },
    })
    return payment
  })
}

export function update(
  deps: PaymentDeps,
  clinicId: string,
  userId: string,
  id: string,
  input: PaymentUpdateInput,
) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      const payment = await repo.update(tx, id, {
        ...(input.date === undefined ? {} : { date: toDate(input.date) }),
        ...(input.amount === undefined ? {} : { amount: input.amount }),
        ...(input.note === undefined ? {} : { note: input.note }),
      })
      await writeAudit(tx, {
        userId,
        action: AUDIT_ACTION.payment_updated,
        entity: 'payment',
        entityId: id,
      })
      return payment
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PAYMENT_TEXT.not_found)
      throw error
    }
  })
}

export function remove(deps: PaymentDeps, clinicId: string, userId: string, id: string) {
  return withClinic(deps.db, clinicId, async (tx) => {
    try {
      await repo.remove(tx, id)
    } catch (error) {
      if (isMissing(error)) throw errors.notFound(PAYMENT_TEXT.not_found)
      throw error
    }
    await writeAudit(tx, {
      userId,
      action: AUDIT_ACTION.payment_deleted,
      entity: 'payment',
      entityId: id,
    })
  })
}

export interface Debtor {
  patientId: string
  fio: string
  phone: string | null
  charges: number
  paid: number
  debt: number
}

/// Qarzdorlar roʻyxati.
///
/// Uch modulning maʼlumoti kerak, shuning uchun har biri oʻz servisidan
/// soʻraladi va birlashtirish shu yerda boʻladi. Bitta SQL bilan qilish
/// tezroq boʻlardi, lekin modul chegarasini buzardi — klinikada bemorlar
/// soni mingdan oshmaydi, bu hajmda farq sezilmaydi
export function debtors(deps: PaymentDeps, clinicId: string, input: DebtorsInput) {
  return withClinic(deps.db, clinicId, async (tx) => {
    const [charges, paid] = await Promise.all([visits.chargeTotals(tx), repo.paidTotals(tx)])

    const all: Omit<Debtor, 'fio' | 'phone'>[] = []
    for (const [patientId, charged] of charges) {
      const paidSum = paid.get(patientId) ?? 0
      const debt = charged - paidSum
      if (debt > 0) all.push({ patientId, charges: charged, paid: paidSum, debt })
    }
    all.sort((a, b) => b.debt - a.debt)

    const totalDebt = all.reduce((sum, row) => sum + row.debt, 0)
    const page = all.slice((input.page - 1) * input.pageSize, input.page * input.pageSize)

    const people = await patients.findByIds(
      tx,
      page.map((row) => row.patientId),
    )
    const byId = new Map(people.map((person) => [person.id, person]))

    const items: Debtor[] = page.map((row) => ({
      ...row,
      fio: byId.get(row.patientId)?.fio ?? '',
      phone: byId.get(row.patientId)?.phone ?? null,
    }))

    return { items, total: all.length, totalDebt, page: input.page, pageSize: input.pageSize }
  })
}
