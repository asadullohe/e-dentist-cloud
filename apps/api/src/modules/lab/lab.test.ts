import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let patientId = ''
let techId = ''
let techCookie = ''
let otherClinicId = ''

interface LabOrder {
  id: string
  fio: string
  status: string
  teeth: number[]
  overdue: boolean
  returns: number
  returnReason: string | null
  techPrice?: number
  techName: string | null
}

function call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

function asTech(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: techCookie } })
}

async function newOrder(extra: Record<string, unknown> = {}) {
  const r = await call('POST', '/api/lab-orders', {
    patientId,
    techId,
    teeth: [16, 17],
    workType: 'crown',
    material: 'metal_ceramic',
    shade: 'A2',
    dueDate: '2026-12-01',
    techPrice: 400_000,
    ...extra,
  })
  return r
}

beforeAll(async () => {
  h = await startHarness()

  patientId = (await call('POST', '/api/patients', { fio: 'Naryad Bemori' })).json().data.id

  // Texnik hisobini egasi ochadi — haqiqiy oqim
  const techRole = await h.ownerDb.role.findFirst({
    where: { clinicId: h.clinicId, template: 'texnik' },
  })
  const tech = await call('POST', '/api/staff', {
    email: 'texnik@example.com',
    fullName: 'Usta Karim',
    roleId: techRole?.id,
    password: 'juda-yaxshi-parol',
  })
  techId = tech.json().data.id

  const login = await h.app.inject({
    method: 'POST',
    url: '/api/auth/login',
    remoteAddress: h.clientIp,
    payload: { email: 'texnik@example.com', password: 'juda-yaxshi-parol' },
  })
  techCookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('naryad yozish', () => {
  it('yoziladi, bemor va texnik ismi bilan qaytadi', async () => {
    const r = await newOrder()
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      fio: 'Naryad Bemori',
      techName: 'Usta Karim',
      doctorName: 'Sinov Egasi',
      status: 'issued',
      returns: 0,
      teeth: [16, 17],
    })
  })

  it('tishsiz yozilmaydi', async () => {
    const r = await newOrder({ teeth: [] })
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.teeth).toBeTruthy()
  })

  it('notoʻgʻri tish raqami rad etiladi', async () => {
    expect((await newOrder({ teeth: [99] })).statusCode).toBe(400)
  })

  it('shkalada yoʻq rang rad etiladi', async () => {
    expect((await newOrder({ shade: 'Z9' })).statusCode).toBe(400)
  })

  it('begona bemorga naryad yozib boʻlmaydi', async () => {
    const foreign = await h.ownerDb.patient.create({
      data: { clinicId: otherClinicId, fio: 'Begona Bemor', fioSearch: 'begona bemor' },
    })
    const r = await newOrder({ patientId: foreign.id })
    expect(r.statusCode).toBe(404)
  })

  it('boshqa klinikaning xodimini texnik qilib boʻlmaydi', async () => {
    const foreignUser = await h.ownerDb.user.create({
      data: {
        clinicId: otherClinicId,
        email: 'begona.texnik@example.com',
        passwordHash: 'x',
      },
    })
    const r = await newOrder({ techId: foreignUser.id })
    expect(r.statusCode).toBe(404)
  })
})

describe('holatlar', () => {
  it('berildi → tayyor → topshirildi', async () => {
    const id = (await newOrder()).json().data.id

    const ready = await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    expect(ready.statusCode).toBe(200)
    expect(ready.json().data.status).toBe('ready')

    const delivered = await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })
    expect(delivered.json().data.status).toBe('delivered')
  })

  it('bosqichni sakrab boʻlmaydi', async () => {
    const id = (await newOrder()).json().data.id
    const r = await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })
    expect(r.statusCode).toBe(400)
  })

  // Topshirish tashrif bilan: bemor narxi tashrifga, shifokor ulushi
  // (narx − texnik narxi) dan (qaror 19/09/2026)
  it('tashrif bilan topshirish: ulush texnik narxini ayirib hisoblanadi', async () => {
    const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
    const doctorRole = roles.find((role) => role.template === 'shifokor')
    const doctor = await call('POST', '/api/staff', {
      email: `topshirish-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Topshirish Shifokori',
      roleId: doctorRole?.id,
      password: 'juda-yaxshi-parol',
      payPercent: 40,
    })
    const doctorId = doctor.json().data.id as string

    const id = (await newOrder({ techPrice: 600_000, teeth: [11, 12] })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })

    // Tayyor boʻlmagan naryadni topshirib boʻlmaydi
    const early = (await newOrder()).json().data.id
    expect(
      (
        await call('POST', `/api/lab-orders/${early}/deliver`, {
          treatment: 'Koronka',
          price: 100,
        })
      ).statusCode,
    ).toBe(400)

    const r = await call('POST', `/api/lab-orders/${id}/deliver`, {
      treatment: 'Sirkoniy koronka — 11, 12',
      price: 1_800_000,
      doctorId,
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.order.status).toBe('delivered')
    const visit = r.json().data.visit
    expect(visit.labOrderId).toBe(id)
    expect(visit.labCost).toBe(600_000)
    expect(visit.doctorId).toBe(doctorId)

    const row = await h.ownerDb.visit.findUnique({ where: { id: visit.id } })
    // (1 800 000 − 600 000) × 40% — toʻliq narxdan emas
    expect(row?.doctorShare).toBe(480_000)
    expect(row?.doctorPercent).toBe(40)

    // Xarajat (texnik narxi) ham yozilgan — eski oqim buzilmadi
    const expenses = await h.ownerDb.expense.findMany({
      where: { clinicId: h.clinicId, category: 'lab', amount: 600_000 },
    })
    expect(expenses.length).toBeGreaterThan(0)
  })

  it('narx tahrirlansa ulush yana texnik narxini ayirib sanaladi', async () => {
    const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
    const doctorRole = roles.find((role) => role.template === 'shifokor')
    const doctor = await call('POST', '/api/staff', {
      email: `topshirish-shifokor2-${h.clinicId.slice(0, 8)}@sinov.uz`,
      fullName: 'Topshirish Shifokori 2',
      roleId: doctorRole?.id,
      password: 'juda-yaxshi-parol',
      payPercent: 50,
    })
    const doctorId = doctor.json().data.id as string
    const id = (await newOrder({ techPrice: 200_000 })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    const r = await call('POST', `/api/lab-orders/${id}/deliver`, {
      treatment: 'Koronka',
      price: 1_000_000,
      doctorId,
    })
    const visitId = r.json().data.visit.id
    await call('PATCH', `/api/visits/${visitId}`, { price: 1_200_000 })
    const row = await h.ownerDb.visit.findUnique({ where: { id: visitId } })
    expect(row?.doctorShare).toBe(500_000)
  })

  it('texnik topshirilganini belgilay olmaydi', async () => {
    const id = (await newOrder()).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })

    const r = await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })
    expect(r.statusCode).toBe(403)
  })

  it('texnik begona naryadni tayyor deb belgilay olmaydi', async () => {
    const id = (await newOrder({ techId: null })).json().data.id
    const r = await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    expect(r.statusCode).toBe(403)
    expect(r.json().error.message).toMatch(/biriktirilmagan/)
  })

  it('«berildi» ga toʻgʻridan-toʻgʻri qaytib boʻlmaydi', async () => {
    const id = (await newOrder()).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    const r = await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'issued' })
    expect(r.statusCode).toBe(400)
  })
})

describe('qaytarish', () => {
  it('tayyordan berildiga qaytadi, sababi va soni yoziladi', async () => {
    const id = (await newOrder()).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })

    const r = await call('POST', `/api/lab-orders/${id}/return`, {
      reason: 'shade',
      note: 'A2 emas, A3 chiqibdi',
    })
    expect(r.statusCode).toBe(200)
    expect(r.json().data).toMatchObject({
      status: 'issued',
      returns: 1,
      returnReason: 'shade',
      returnNote: 'A2 emas, A3 chiqibdi',
    })

    // Ikkinchi qaytish sanoqni oshiradi
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    const second = await call('POST', `/api/lab-orders/${id}/return`, { reason: 'fit' })
    expect(second.json().data.returns).toBe(2)
  })

  it('berildi holatidagini qaytarib boʻlmaydi', async () => {
    const id = (await newOrder()).json().data.id
    const r = await call('POST', `/api/lab-orders/${id}/return`, { reason: 'fit' })
    expect(r.statusCode).toBe(400)
  })

  it('sababsiz qaytarilmaydi', async () => {
    const id = (await newOrder()).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    const r = await call('POST', `/api/lab-orders/${id}/return`, {})
    expect(r.statusCode).toBe(400)
  })
})

describe('roʻyxat', () => {
  it('muddati oʻtganlari tepada', async () => {
    await newOrder({ dueDate: '2020-01-15' })
    const rows: LabOrder[] = (await call('GET', '/api/lab-orders')).json().data
    expect(rows[0]?.overdue).toBe(true)
    // Topshirilgan naryad muddati oʻtgan boʻlsa ham qizarmaydi
    const delivered = rows.find((row) => row.status === 'delivered')
    expect(delivered?.overdue).toBe(false)
  })

  it('holat boʻyicha filtr', async () => {
    const rows: LabOrder[] = (await call('GET', '/api/lab-orders?status=ready')).json().data
    expect(rows.every((row) => row.status === 'ready')).toBe(true)
  })

  it('texnik faqat oʻz naryadlarini koʻradi', async () => {
    await newOrder({ techId: null })
    const mine: LabOrder[] = (await asTech('GET', '/api/lab-orders')).json().data
    const all: LabOrder[] = (await call('GET', '/api/lab-orders')).json().data

    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((row) => row.techName === 'Usta Karim')).toBe(true)
    expect(all.length).toBeGreaterThan(mine.length)
  })

  // Shifokor (patients.all yoʻq) faqat oʻzi yozgan naryadlarni koʻradi —
  // boshqa shifokorning bemori va ishi unga koʻrinmaydi (11-bosqich)
  it('shifokor faqat oʻzi yozgan naryadlarni koʻradi, boshqaniki — topilmadi', async () => {
    const roles = await h.ownerDb.role.findMany({ where: { clinicId: h.clinicId } })
    const doctorRole = roles.find((role) => role.template === 'shifokor')
    const email = `naryad-shifokor-${h.clinicId.slice(0, 8)}@sinov.uz`
    await call('POST', '/api/staff', {
      email,
      fullName: 'Naryad Shifokori',
      roleId: doctorRole?.id,
      password: 'juda-yaxshi-parol',
      payPercent: 30,
    })
    const login = await h.app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: h.clientIp,
      payload: { email, password: 'juda-yaxshi-parol' },
    })
    const cookie = `ed_session=${login.cookies.find((c) => c.name === 'ed_session')?.value}`
    const asDoctor = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
      h.app.inject({ method, url, payload, headers: { cookie } })

    // Egasining naryadi bor (yuqorida yozilgan); shifokor oʻzinikini yozadi
    const ownersOrder = (await call('GET', '/api/lab-orders')).json().data[0] as LabOrder
    const own = await asDoctor('POST', '/api/lab-orders', {
      patientId,
      teeth: [11],
      workType: 'crown',
      material: 'zirconia',
      dueDate: '2027-01-10',
    })
    expect(own.statusCode).toBe(200)

    const mine: LabOrder[] = (await asDoctor('GET', '/api/lab-orders')).json().data
    expect(mine.map((row) => row.id)).toEqual([own.json().data.id])

    expect(
      (await asDoctor('PATCH', `/api/lab-orders/${ownersOrder.id}`, { note: 'x' })).statusCode,
    ).toBe(404)
    expect((await asDoctor('DELETE', `/api/lab-orders/${ownersOrder.id}`)).statusCode).toBe(404)
    // Egasi (patients.all) hammasini koʻradi
    const all: LabOrder[] = (await call('GET', '/api/lab-orders')).json().data
    expect(all.map((row) => row.id)).toContain(own.json().data.id)
    await asDoctor('DELETE', `/api/lab-orders/${own.json().data.id}`)
  })

  // Texnik boshqaning naryadini koʻrish uchun filtr bera olmaydi
  it('texnik filtr bilan ham begona naryadga yeta olmaydi', async () => {
    const rows: LabOrder[] = (
      await asTech('GET', '/api/lab-orders?techId=00000000-0000-7000-8000-000000000000')
    ).json().data
    expect(rows.every((row) => row.techName === 'Usta Karim')).toBe(true)
  })

  it('begona klinikaning naryadi koʻrinmaydi', async () => {
    const foreignPatient = await h.ownerDb.patient.create({
      data: { clinicId: otherClinicId, fio: 'Begona Bemor 2', fioSearch: 'begona bemor 2' },
    })
    const foreignUser = await h.ownerDb.user.findFirst({ where: { clinicId: otherClinicId } })
    const foreign = await h.ownerDb.labOrder.create({
      data: {
        clinicId: otherClinicId,
        patientId: foreignPatient.id,
        doctorId: foreignUser?.id ?? '',
        teeth: [11],
        workType: 'crown',
        material: 'zirconia',
        dueDate: new Date('2026-12-01T00:00:00Z'),
      },
    })

    const rows: LabOrder[] = (await call('GET', '/api/lab-orders')).json().data
    expect(rows.some((row) => row.id === foreign.id)).toBe(false)
    expect((await call('PATCH', `/api/lab-orders/${foreign.id}`, { shade: 'A1' })).statusCode).toBe(
      404,
    )
  })
})

describe('texnik narxi', () => {
  it('texnik oʻz narxini koʻradi', async () => {
    const rows: LabOrder[] = (await asTech('GET', '/api/lab-orders')).json().data
    expect(rows[0]?.techPrice).toBe(400_000)
  })

  it('narxi yoʻq rolda summa javobga tushmaydi', async () => {
    // Shifokorda `lab.write` bor, `lab.cost` yoʻq
    const doctorRole = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctorRole?.id } })

    const rows: LabOrder[] = (await call('GET', '/api/lab-orders')).json().data
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.techPrice === undefined)).toBe(true)

    // Narxni oʻzgartirishga ham urinib koʻramiz
    const r = await call('PATCH', `/api/lab-orders/${rows[0]?.id}`, { techPrice: 1 })
    expect(r.statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  it('texnik narxni oʻzgartira olmaydi — bu `lab.write` ishi', async () => {
    const rows: LabOrder[] = (await asTech('GET', '/api/lab-orders')).json().data
    const r = await asTech('PATCH', `/api/lab-orders/${rows[0]?.id}`, { techPrice: 1 })
    expect(r.statusCode).toBe(403)
  })
})

describe('ruxsat', () => {
  it('qabulxona naryadlarni koʻra olmaydi', async () => {
    const reception = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'qabulxona' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: reception?.id } })
    expect((await call('GET', '/api/lab-orders')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  // Naryadga texnik tayinlash uchun shifokorga xodim ismlari kerak, lekin
  // toʻliq roʻyxat (pochta, holat) `staff.manage` ishi
  it('ismlar roʻyxati `lab.write` ga ochiq, toʻliq roʻyxat esa yopiq', async () => {
    const doctorRole = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })
    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctorRole?.id } })

    const names = await call('GET', '/api/staff/names')
    expect(names.statusCode).toBe(200)
    expect(names.json().data[0]).toHaveProperty('fullName')
    expect(names.json().data[0]).not.toHaveProperty('email')
    expect((await call('GET', '/api/staff')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })

  it('texnik ismlar roʻyxatini soʻray olmaydi', async () => {
    expect((await asTech('GET', '/api/staff/names')).statusCode).toBe(403)
  })

  it('naryad oʻchiriladi', async () => {
    const id = (await newOrder()).json().data.id
    expect((await call('DELETE', `/api/lab-orders/${id}`)).statusCode).toBe(200)
    expect((await call('DELETE', `/api/lab-orders/${id}`)).statusCode).toBe(404)
  })
})

describe('topshirilgandagi bogʻlanishlar', () => {
  it('tish xaritasi yangilanadi va materiali yoziladi', async () => {
    const id = (await newOrder({ teeth: [24, 25], material: 'zirconia' })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const chart = (await call('GET', `/api/patients/${patientId}/teeth`)).json().data
    const teeth: { tooth: number; status: string; material: string | null }[] = chart.teeth
    for (const tooth of [24, 25]) {
      expect(teeth.find((row) => row.tooth === tooth)).toMatchObject({
        status: 'koronka',
        material: 'sirkoniy',
      })
    }
  })

  it('koʻprik ishi «quyma tish» holatini beradi', async () => {
    const id = (await newOrder({ teeth: [34, 35], workType: 'bridge' })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const teeth = (await call('GET', `/api/patients/${patientId}/teeth`)).json().data.teeth
    expect(teeth.find((row: { tooth: number }) => row.tooth === 34).status).toBe('koprik')
  })

  // Olinadigan protez tishga oʻrnatilmaydi — xarita tegilmaydi
  it('olinadigan protez tish holatini oʻzgartirmaydi', async () => {
    const id = (await newOrder({ teeth: [37], workType: 'denture' })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const teeth = (await call('GET', `/api/patients/${patientId}/teeth`)).json().data.teeth
    expect(teeth.find((row: { tooth: number }) => row.tooth === 37)).toBeUndefined()
  })

  it('texnik narxi «Texnik ishlari» turkumida xarajatga tushadi', async () => {
    const month = new Date().toISOString().slice(0, 7)
    const before = (await call('GET', `/api/expenses?month=${month}`)).json().data.total

    const id = (await newOrder({ teeth: [46], techPrice: 650_000 })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const after = (await call('GET', `/api/expenses?month=${month}`)).json().data
    expect(after.total - before).toBe(650_000)
    const row = after.items.find((item: { amount: number }) => item.amount === 650_000)
    expect(row.category).toBe('lab')
    expect(row.description).toContain('Naryad Bemori')
  })

  // Ikki marta topshirib boʻlmagani uchun xarajat ham ikki marta yozilmaydi
  it('topshirilgan naryadni qayta topshirib boʻlmaydi', async () => {
    const month = new Date().toISOString().slice(0, 7)
    const id = (await newOrder({ teeth: [15], techPrice: 120_000 })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const again = await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })
    expect(again.statusCode).toBe(400)

    const items = (await call('GET', `/api/expenses?month=${month}`)).json().data.items
    expect(items.filter((item: { amount: number }) => item.amount === 120_000)).toHaveLength(1)
  })

  it('narxsiz naryad xarajat yozmaydi', async () => {
    const month = new Date().toISOString().slice(0, 7)
    const before = (await call('GET', `/api/expenses?month=${month}`)).json().data.items.length

    const id = (await newOrder({ teeth: [47], techPrice: 0 })).json().data.id
    await asTech('PATCH', `/api/lab-orders/${id}/status`, { status: 'ready' })
    await call('PATCH', `/api/lab-orders/${id}/status`, { status: 'delivered' })

    const after = (await call('GET', `/api/expenses?month=${month}`)).json().data.items.length
    expect(after).toBe(before)
  })
})
