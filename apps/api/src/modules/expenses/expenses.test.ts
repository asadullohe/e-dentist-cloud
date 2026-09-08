import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let otherClinicId = ''

interface ExpenseRow {
  id: string
  date: string
  category: string
  description: string
  amount: number
}

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

async function add(data: Partial<ExpenseRow>) {
  const r = await call('POST', '/api/expenses', {
    date: '2026-03-10',
    category: 'materials',
    description: 'Plomba materiali',
    amount: 250_000,
    ...data,
  })
  return r
}

beforeAll(async () => {
  h = await startHarness()

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('xarajat yozish', () => {
  it('yoziladi va qaytadi', async () => {
    const r = await add({})
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      date: '2026-03-10',
      category: 'materials',
      description: 'Plomba materiali',
      amount: 250_000,
    })
  })

  // Hali sarflanmagan pul xarajat emas
  it('kelajakdagi sana rad etiladi', async () => {
    const r = await add({ date: '2099-01-01' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.date).toMatch(/kelajakda/)
  })

  it('summa musbat boʻlishi shart', async () => {
    for (const amount of [0, -5000]) {
      const r = await add({ amount })
      expect(r.statusCode, String(amount)).toBe(400)
      expect(r.json().error.fields.amount).toBeTruthy()
    }
  })

  it('izohsiz yozib boʻlmaydi', async () => {
    const r = await add({ description: ' ' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.description).toMatch(/Nima uchun/)
  })

  it('notoʻgʻri turkum rad etiladi', async () => {
    const r = await add({ category: 'kosmos' })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.category).toBeTruthy()
  })

  // Turkum koʻrsatilmasa «Boshqa» boʻladi — forma uni tanlashga majburlamaydi
  it('turkum berilmasa boshqa boʻladi', async () => {
    const r = await call('POST', '/api/expenses', {
      date: '2026-03-11',
      description: 'Choy-qahva',
      amount: 30_000,
    })
    expect(r.json().data.category).toBe('other')
  })
})

describe('oy boʻyicha roʻyxat', () => {
  it('faqat soʻralgan oy chiqadi', async () => {
    await add({ date: '2026-04-01', description: 'Aprel xarajati', amount: 100_000 })

    const r = await call('GET', '/api/expenses?month=2026-03')
    const items: ExpenseRow[] = r.json().data.items
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((row) => row.date.startsWith('2026-03'))).toBe(true)
  })

  // Oyning oxirgi kuni chegaradan tushib qolmasin
  it('oyning oxirgi kuni ham kiradi', async () => {
    await add({ date: '2026-05-31', description: 'May oxiri', amount: 70_000 })
    const items: ExpenseRow[] = (await call('GET', '/api/expenses?month=2026-05')).json().data.items
    expect(items).toHaveLength(1)
  })

  it('jamlanma turkum boʻyicha va jami summa', async () => {
    await add({ date: '2026-06-05', category: 'rent', description: 'Ijara', amount: 3_000_000 })
    await add({ date: '2026-06-06', category: 'salary', description: 'Oylik', amount: 5_000_000 })
    await add({ date: '2026-06-07', category: 'rent', description: 'Ombor', amount: 1_000_000 })

    const data = (await call('GET', '/api/expenses?month=2026-06')).json().data
    expect(data.total).toBe(9_000_000)
    // Katta summa tepada
    expect(data.byCategory[0]).toEqual({ category: 'salary', total: 5_000_000 })
    expect(data.byCategory[1]).toEqual({ category: 'rent', total: 4_000_000 })
  })

  it('notoʻgʻri oy rad etiladi', async () => {
    for (const month of ['2026-13', '2026', 'mart']) {
      const r = await call('GET', `/api/expenses?month=${month}`)
      expect(r.statusCode, month).toBe(400)
    }
  })

  it('boʻsh oy nol bilan qaytadi', async () => {
    const data = (await call('GET', '/api/expenses?month=2026-01')).json().data
    expect(data).toEqual({ items: [], total: 0, byCategory: [] })
  })
})

describe('tahrirlash va oʻchirish', () => {
  it('summasi va turkumi oʻzgaradi', async () => {
    const id = (await add({ date: '2026-07-01', description: 'Uskuna', amount: 500_000 })).json()
      .data.id

    const r = await call('PATCH', `/api/expenses/${id}`, { amount: 650_000, category: 'equipment' })
    expect(r.json().data).toMatchObject({ amount: 650_000, category: 'equipment' })
    // Tegilmagan maydon joyida qoladi
    expect(r.json().data.description).toBe('Uskuna')
  })

  it('oʻchiriladi', async () => {
    const id = (await add({ date: '2026-08-01', description: 'Reklama', amount: 200_000 })).json()
      .data.id

    expect((await call('DELETE', `/api/expenses/${id}`)).statusCode).toBe(200)
    const items: ExpenseRow[] = (await call('GET', '/api/expenses?month=2026-08')).json().data.items
    expect(items).toHaveLength(0)
  })

  it('yoʻq xarajat 404', async () => {
    const r = await call('PATCH', '/api/expenses/0195f7b7-0000-7000-8000-000000000000', {
      amount: 1000,
    })
    expect(r.statusCode).toBe(404)
  })
})

describe('koʻp ijarachilik', () => {
  it('begona klinikaning xarajati roʻyxatda koʻrinmaydi', async () => {
    await h.ownerDb.expense.create({
      data: {
        clinicId: otherClinicId,
        date: new Date('2026-03-15T00:00:00Z'),
        category: 'rent',
        description: 'Begona ijara',
        amount: 999_999,
      },
    })

    const items: ExpenseRow[] = (await call('GET', '/api/expenses?month=2026-03')).json().data.items
    expect(items.map((row) => row.description)).not.toContain('Begona ijara')
  })

  it('begona xarajatni oʻzgartirib ham, oʻchirib ham boʻlmaydi', async () => {
    const foreign = await h.ownerDb.expense.findFirst({ where: { clinicId: otherClinicId } })

    expect((await call('PATCH', `/api/expenses/${foreign?.id}`, { amount: 1 })).statusCode).toBe(
      404,
    )
    expect((await call('DELETE', `/api/expenses/${foreign?.id}`)).statusCode).toBe(404)

    const after = await h.ownerDb.expense.findUnique({ where: { id: foreign?.id ?? '' } })
    expect(after?.amount).toBe(999_999)
  })
})

describe('ruxsat', () => {
  it('shifokor xarajatlarni koʻrmaydi ham, yozmaydi ham', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    expect((await call('GET', '/api/expenses?month=2026-03')).statusCode).toBe(403)
    expect((await add({})).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
