import AdmZip from 'adm-zip'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

let h: Harness
let patientId = ''
let otherClinicId = ''

function call(method: 'GET' | 'POST', url: string, payload?: object) {
  return h.app.inject({ method, url, payload, headers: { cookie: h.cookie } })
}

async function archive() {
  const r = await call('GET', '/api/export')
  return { response: r, zip: new AdmZip(r.rawPayload) }
}

beforeAll(async () => {
  h = await startHarness()

  patientId = (
    await call('POST', '/api/patients', { fio: 'Eksport Bemori', phone: '901234567' })
  ).json().data.id
  await call('POST', '/api/visits', {
    patientId,
    date: '2026-03-05',
    treatment: 'Karies davolash',
    tooth: 16,
    price: 300_000,
  })
  await call('POST', '/api/payments', { patientId, date: '2026-03-06', amount: 200_000 })
  await call('POST', '/api/appointments', { patientId, date: '2026-04-01', time: '10:00' })
  await call('POST', '/api/expenses', {
    date: '2026-03-02',
    category: 'materials',
    description: 'Plomba materiali',
    amount: 150_000,
  })
  await call('POST', '/api/services', { name: 'Karies davolash', price: 300_000 })
  await call('POST', '/api/lab-orders', {
    patientId,
    teeth: [16],
    workType: 'crown',
    material: 'zirconia',
    dueDate: '2026-05-01',
    techPrice: 500_000,
  })

  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
  otherClinicId = other.id
  await h.ownerDb.patient.create({
    data: { clinicId: otherClinicId, fio: 'Begona Bemor', fioSearch: 'begona bemor' },
  })
}, 30_000)

afterAll(async () => {
  await removeClinic(h.ownerDb, otherClinicId)
  await h.stop()
})

describe('toʻliq eksport', () => {
  it('zip qaytadi va nomi sana bilan', async () => {
    const { response } = await archive()
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('application/zip')
    expect(response.headers['content-disposition']).toMatch(
      /e-dentist-malumot-\d{4}-\d{2}-\d{2}\.zip/,
    )
  })

  it('har boʻlim uchun alohida fayl bor', async () => {
    const { zip } = await archive()
    const names = zip.getEntries().map((entry) => entry.entryName)
    expect(names).toEqual(
      expect.arrayContaining([
        'bemorlar.xlsx',
        'tashriflar.xlsx',
        'tish-xaritasi.xlsx',
        'tolovlar.xlsx',
        'qabullar.xlsx',
        'xarajatlar.xlsx',
        'naryadlar.xlsx',
        'narxnoma.xlsx',
        'malumot.txt',
      ]),
    )
  })

  it('maʼlumot faylida klinika nomi bor', async () => {
    const { zip } = await archive()
    const readme = zip.getEntry('malumot.txt')?.getData().toString('utf8') ?? ''
    expect(readme).toContain('Klinika:')
    expect(readme).toContain('Yuklab olingan sana:')
  })

  // Fayllar boʻsh boʻlmasligi kerak — sarlavha qatori ham yozilishi shart
  it('fayllar boʻsh emas', async () => {
    const { zip } = await archive()
    for (const entry of zip.getEntries()) {
      expect(entry.getData().length, entry.entryName).toBeGreaterThan(0)
    }
  })

  it('yuklab olish audit ga yoziladi', async () => {
    await archive()
    const rows = await h.ownerDb.auditLog.findMany({
      where: { clinicId: h.clinicId, action: 'data_exported' },
    })
    expect(rows.length).toBeGreaterThan(0)
  })

  it('begona klinikaning bemori arxivga tushmaydi', async () => {
    const { zip } = await archive()
    const patients = zip.getEntry('bemorlar.xlsx')?.getData() ?? Buffer.alloc(0)
    // .xlsx — zip ichida zip: matn siqilgan holda ham baytlar boʻyicha
    // qidirmaymiz, ochib koʻramiz
    const inner = new AdmZip(patients)
    const strings =
      inner.getEntry('xl/sharedStrings.xml')?.getData().toString('utf8') ??
      inner
        .getEntries()
        .map((entry) => entry.getData().toString('utf8'))
        .join('')
    expect(strings).toContain('Eksport Bemori')
    expect(strings).not.toContain('Begona Bemor')
  })
})

describe('ruxsat', () => {
  it('`data.export` yoʻq boʻlsa 403', async () => {
    const doctor = await h.ownerDb.role.findFirst({
      where: { clinicId: h.clinicId, template: 'shifokor' },
    })
    const owner = await h.ownerDb.role.findFirst({ where: { clinicId: h.clinicId, isOwner: true } })

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: doctor?.id } })
    expect((await call('GET', '/api/export')).statusCode).toBe(403)

    await h.ownerDb.user.update({ where: { id: h.userId }, data: { roleId: owner?.id } })
  })
})
