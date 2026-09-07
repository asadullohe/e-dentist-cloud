import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, removeClinic, startHarness } from '../../test-support/harness.js'

let h: Harness
/// Ikkinchi klinika — koʻp ijarachilik tekshiruvi uchun
let otherClinicId = ''
let otherPatientId = ''

async function post(url: string, payload: object) {
  return await h.app.inject({ method: 'POST', url, payload, headers: { cookie: h.cookie } })
}
async function get(url: string) {
  return await h.app.inject({ method: 'GET', url, headers: { cookie: h.cookie } })
}

beforeAll(async () => {
  h = await startHarness()

  // B klinikasi va uning bemori — toʻgʻridan-toʻgʻri ega ulanishi bilan
  const other = await h.ownerDb.clinic.create({
    data: { name: 'B klinikasi', expiresAt: new Date('2030-01-01') },
  })
  otherClinicId = other.id
  const otherPatient = await h.ownerDb.patient.create({
    data: {
      clinicId: otherClinicId,
      fio: 'Begona Bemor',
      fioSearch: 'begona bemor',
      phone: '+998900000001',
    },
  })
  otherPatientId = otherPatient.id
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('bemor qoʻshish', () => {
  it('telefon bir xil koʻrinishga keltiriladi', async () => {
    const r = await post('/api/patients', { fio: 'Karimov Aziz', phone: '90 123 45 67' })
    expect(r.statusCode).toBe(200)
    expect(r.json().data.phone).toBe('+998901234567')
  })

  it('tugʻilgan sana kun surilmasdan saqlanadi', async () => {
    const r = await post('/api/patients', { fio: 'Sanali Bemor', birthDate: '1990-05-12' })
    expect(r.json().data.birthDate).toBe('1990-05-12T00:00:00.000Z')
  })

  it('notoʻgʻri maʼlumot maydon boʻyicha rad etiladi', async () => {
    const r = await post('/api/patients', { fio: 'Ab', phone: '9012', birthDate: '2099-01-01' })
    expect(r.statusCode).toBe(400)
    const f = r.json().error.fields
    expect(f.fio).toBe('Kamida 3 ta harf kiriting')
    expect(f.phone).toBe('Raqam toʻliq emas: +998 XX XXX XX XX')
    expect(f.birthDate).toBe('Sana kelajakda boʻlishi mumkin emas')
  })
})

describe('qidiruv', () => {
  beforeAll(async () => {
    await post('/api/patients', { fio: 'Gʻayratov Shoʻhrat', phone: '901112233' })
  })

  // Oʻzbekcha ismlarda apostrof uch xil yoziladi, ustiga odam uni umuman
  // yozmasligi ham mumkin — qidiruv hammasini topishi kerak
  it('apostrofning har qanday koʻrinishi bilan, hatto usiz ham topiladi', async () => {
    for (const query of ['Gʻayratov', "G'ayratov", 'G’ayratov', 'Gayratov', 'gayrat']) {
      const r = await get(`/api/patients?q=${encodeURIComponent(query)}`)
      expect(r.json().data.items.length, query).toBeGreaterThanOrEqual(1)
    }
  })

  it('telefon raqami boʻyicha ham topiladi', async () => {
    const r = await get('/api/patients?q=1112233')
    expect(r.json().data.items[0].fio).toBe('Gʻayratov Shoʻhrat')
  })

  it('matnli qidiruvda telefon sharti qoʻshilmaydi', async () => {
    const r = await get('/api/patients?q=karimov')
    expect(r.json().data.items).toHaveLength(1)
    expect(r.json().data.items[0].fio).toBe('Karimov Aziz')
  })
})

describe('roʻyxat va sahifalash', () => {
  it('jami sonni va sahifani qaytaradi', async () => {
    const r = await get('/api/patients?page=1&pageSize=2')
    const data = r.json().data
    expect(data.items).toHaveLength(2)
    expect(data.total).toBe(3)
    expect(data.page).toBe(1)
  })

  it('ikkinchi sahifada qolgani', async () => {
    const r = await get('/api/patients?page=2&pageSize=2')
    expect(r.json().data.items).toHaveLength(1)
  })
})

describe('kartochka, tahrirlash va oʻchirish', () => {
  it('kartochka ochilishi audit ga yoziladi', async () => {
    const list = await get('/api/patients?q=karimov')
    const id = list.json().data.items[0].id

    const r = await get(`/api/patients/${id}`)
    expect(r.statusCode).toBe(200)

    const entry = await h.ownerDb.auditLog.findFirst({
      where: { clinicId: h.clinicId, action: 'patient_viewed', entityId: id },
    })
    expect(entry).not.toBeNull()
  })

  it('tahrirlanadi', async () => {
    const list = await get('/api/patients?q=karimov')
    const id = list.json().data.items[0].id

    const r = await h.app.inject({
      method: 'PATCH',
      url: `/api/patients/${id}`,
      payload: { address: 'Toshkent, Chilonzor' },
      headers: { cookie: h.cookie },
    })
    expect(r.json().data.address).toBe('Toshkent, Chilonzor')
  })

  it('tashrifi bor bemorni oʻchirib boʻlmaydi', async () => {
    const list = await get('/api/patients?q=karimov')
    const id = list.json().data.items[0].id
    await h.ownerDb.visit.create({
      data: {
        clinicId: h.clinicId,
        patientId: id,
        date: new Date('2026-09-01'),
        treatment: 'Koʻrik',
        price: 50_000,
      },
    })

    const r = await h.app.inject({
      method: 'DELETE',
      url: `/api/patients/${id}`,
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(409)
    expect(r.json().error.message).toMatch(/tashrif yoki toʻlov/)
  })

  it('yozuvsiz bemor oʻchiriladi', async () => {
    const created = await post('/api/patients', { fio: 'Oʻchiriladigan Bemor' })
    const id = created.json().data.id

    const r = await h.app.inject({
      method: 'DELETE',
      url: `/api/patients/${id}`,
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(200)
    expect(await h.ownerDb.patient.findUnique({ where: { id } })).toBeNull()
  })
})

// Har modul uchun majburiy test (tz.md 5-boʻlim)
describe('koʻp ijarachilik', () => {
  it('roʻyxatda begona klinikaning bemori koʻrinmaydi', async () => {
    const r = await get('/api/patients?pageSize=100')
    const names = r.json().data.items.map((p: { fio: string }) => p.fio)
    expect(names).not.toContain('Begona Bemor')
  })

  it('begona bemorni identifikatori boʻyicha ham ochib boʻlmaydi', async () => {
    const r = await get(`/api/patients/${otherPatientId}`)
    expect(r.statusCode).toBe(404)
  })

  it('begona bemorni tahrirlab boʻlmaydi', async () => {
    const r = await h.app.inject({
      method: 'PATCH',
      url: `/api/patients/${otherPatientId}`,
      payload: { fio: 'Buzildi' },
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(404)

    const untouched = await h.ownerDb.patient.findUnique({ where: { id: otherPatientId } })
    expect(untouched?.fio).toBe('Begona Bemor')
  })

  it('begona bemorni oʻchirib boʻlmaydi', async () => {
    const r = await h.app.inject({
      method: 'DELETE',
      url: `/api/patients/${otherPatientId}`,
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.patient.findUnique({ where: { id: otherPatientId } })).not.toBeNull()
  })
})

describe('ruxsat', () => {
  it('kirmagan foydalanuvchi 401 oladi', async () => {
    const r = await h.app.inject({ method: 'GET', url: '/api/patients' })
    expect(r.statusCode).toBe(401)
  })

  it('patients.read yoʻq rolda 403', async () => {
    const tech = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'texnik' },
    })
    const owner = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, isOwner: true },
    })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: tech?.id } })
    const blocked = await get('/api/patients')
    expect(blocked.statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
    expect((await get('/api/patients')).statusCode).toBe(200)
  })
})
