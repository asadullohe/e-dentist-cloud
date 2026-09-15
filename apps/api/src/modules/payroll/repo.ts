// payroll moduli `staff_payouts` jadvaliga egalik qiladi. Summa va sana
// xarajatda — bu yerda faqat bogʻlanish (tz.md 15-boʻlim).

import { type ClinicTx, tenantScoped } from '../../platform/tenant.js'

const SELECT = {
  id: true,
  userId: true,
  month: true,
  expenseId: true,
} as const

export function listByMonth(tx: ClinicTx, month: Date) {
  return tx.staffPayout.findMany({
    where: { month },
    select: SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export function find(tx: ClinicTx, id: string) {
  return tx.staffPayout.findUnique({ where: { id }, select: SELECT })
}

export function create(
  tx: ClinicTx,
  id: string,
  data: { userId: string; month: Date; expenseId: string },
) {
  return tx.staffPayout.create({ data: tenantScoped({ id, ...data }), select: SELECT })
}
