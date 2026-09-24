// Xarajatlar va ish haqi. Texnik narxi xarajatga yozilmaydi — u tashrifda
// `lab_cost` boʻlib turadi va hisobotda alohida ayriladi (CLAUDE.md)

import { daysFromToday, iso, monthOf } from './client.js'
import { type Ctx, int, roundMoney } from './context.js'

type Category = 'materials' | 'equipment' | 'rent' | 'utilities' | 'ads' | 'tax' | 'other'

interface Monthly {
  day: number
  category: Category
  description: string
  amount: () => number
}

export async function createExpenses(ctx: Ctx, months: number): Promise<void> {
  const today = iso(daysFromToday(0))
  const monthly: Monthly[] = [
    { day: 1, category: 'rent', description: 'Ijara — Bunyodkor 12', amount: () => 9_000_000 },
    {
      day: 8,
      category: 'utilities',
      description: 'Elektr, gaz, suv',
      amount: () => roundMoney(1_100_000 + ctx.rand() * 400_000),
    },
    { day: 10, category: 'ads', description: 'Instagram reklama', amount: () => 1_500_000 },
    { day: 12, category: 'other', description: 'Internet va telefon', amount: () => 350_000 },
    {
      day: 15,
      category: 'tax',
      description: 'Aylanmadan soliq',
      amount: () => roundMoney(3_500_000 + ctx.rand() * 1_500_000),
    },
  ]
  const materials = [
    'Plomba materiallari (Filtek, Estelite)',
    'Anesteziya (Ubistezin)',
    'Endodontik asboblar (fayllar)',
    'Bir martalik buyumlar: qoʻlqop, niqob',
    'Dezinfeksiya vositalari',
  ]

  for (let m = months; m >= 0; m--) {
    const base = daysFromToday(0)
    base.setDate(1)
    base.setMonth(base.getMonth() - m)
    const at = (day: number) => {
      const d = new Date(base)
      d.setDate(day)
      return iso(d)
    }
    for (const e of monthly) {
      const date = at(e.day)
      if (date > today) continue
      await expense(ctx, date, e.category, e.description, e.amount())
    }
    for (let i = 0; i < 3; i++) {
      const date = at(int(ctx, 2, 27))
      if (date > today) continue
      const what = materials[(m * 3 + i) % materials.length] ?? materials[0] ?? ''
      await expense(ctx, date, 'materials', what, roundMoney(700_000 + ctx.rand() * 2_300_000))
    }
  }
  await expense(ctx, iso(daysFromToday(-40)), 'equipment', 'Avtoklav (Melag) — yangi', 18_500_000)
}

function expense(ctx: Ctx, date: string, category: Category, description: string, amount: number) {
  return ctx.owner.post('/expenses', { date, category, description, amount })
}

interface Payroll {
  rows: { userId: string; remaining: number }[]
}

/// Oʻtgan oylar uchun ish haqi toʻlab berilgan: har kimga qolgan summa
/// keyingi oyning 5-sanasida. Joriy oy hali toʻlanmagan
export async function payOut(ctx: Ctx, months: number): Promise<void> {
  for (let m = months; m >= 1; m--) {
    const d = daysFromToday(0)
    d.setDate(1)
    d.setMonth(d.getMonth() - m)
    const month = monthOf(d)
    const payday = new Date(d)
    payday.setMonth(payday.getMonth() + 1)
    payday.setDate(5)
    const payroll = await ctx.owner.get<Payroll>(`/payroll?month=${month}`)
    for (const row of payroll.rows) {
      if (row.userId === ctx.staff.owner || row.remaining <= 0) continue
      await ctx.owner.post('/payroll/payouts', {
        month,
        userId: row.userId,
        amount: row.remaining,
        date: iso(payday),
      })
    }
  }
}
