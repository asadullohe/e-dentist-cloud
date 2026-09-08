import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createOtherClinic,
  type Harness,
  removeClinic,
  startHarness,
} from '../../test-support/harness.js'

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

/// Oqimdan oʻqilganda read-excel-file barcha varaqlarni
/// [{sheet, data}] koʻrinishida qaytaradi va `sheet` sozlamasini
/// eʼtiborsiz qoldiradi — kerakli varaqni oʻzimiz tanlaymiz
async function sheetRows(body: Buffer, index = 1) {
  const { Readable } = await import('node:stream')
  const readXlsxFile = (await import('read-excel-file/node')).default
  const sheets = (await readXlsxFile(Readable.from(body))) as unknown as {
    sheet: string
    data: unknown[][]
  }[]
  return sheets[index - 1]?.data ?? []
}

beforeAll(async () => {
  h = await startHarness()

  // B klinikasi va uning bemori — toʻgʻridan-toʻgʻri ega ulanishi bilan
  const other = await createOtherClinic(h.ownerDb, 'B klinikasi')
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

describe('bemor rasmlari', () => {
  /// 1×1 shaffof PNG — haqiqiy fayl, soxta bayt emas
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )

  function upload(id: string, body: Buffer, type: string, filename = 'rasm.png') {
    const boundary = '----edentist'
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${type}\r\n\r\n`,
    )
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
    return h.app.inject({
      method: 'POST',
      url: `/api/patients/${id}/images`,
      headers: { cookie: h.cookie, 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: Buffer.concat([head, body, tail]),
    })
  }

  let patientId = ''

  beforeAll(async () => {
    const created = await post('/api/patients', { fio: 'Rasmli Bemor' })
    patientId = created.json().data.id
  })

  it('rasm yuklanadi va imzolangan havola qaytadi', async () => {
    const r = await upload(patientId, PNG, 'image/png')
    expect(r.statusCode).toBe(200)
    expect(r.json().data.url).toContain('X-Amz-Signature')
  })

  it('roʻyxatda koʻrinadi', async () => {
    const r = await get(`/api/patients/${patientId}/images`)
    expect(r.json().data).toHaveLength(1)
    expect(r.json().data[0].url).toContain('X-Amz-Signature')
  })

  it('rasm boʻlmagan fayl rad etiladi', async () => {
    const r = await upload(patientId, Buffer.from('men rasm emasman'), 'text/plain', 'x.txt')
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/Faqat rasm/)
  })

  it('oʻchirilganda saqlagichdan ham ketadi', async () => {
    const list = await get(`/api/patients/${patientId}/images`)
    const image = list.json().data[0]

    const before = await fetch(image.url)
    expect(before.status).toBe(200)

    const r = await h.app.inject({
      method: 'DELETE',
      url: `/api/images/${image.id}`,
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(200)

    const after = await fetch(image.url)
    expect(after.status).toBe(404)
    expect((await get(`/api/patients/${patientId}/images`)).json().data).toHaveLength(0)
  })

  it('begona klinikaning bemoriga rasm yuklab boʻlmaydi', async () => {
    const r = await upload(otherPatientId, PNG, 'image/png')
    expect(r.statusCode).toBe(404)
    expect(await h.ownerDb.patientImage.count({ where: { patientId: otherPatientId } })).toBe(0)
  })
})

describe('Excel', () => {
  it('shablon toʻgʻri ustunlar va ikkita namuna qator bilan keladi', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/import/template',
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(200)
    expect(r.headers['content-type']).toContain('spreadsheetml')

    const rows = await sheetRows(r.rawPayload)
    expect(rows[0]).toEqual(['ID', 'F.I.O.', 'Telefon', 'Tugʻilgan sana', 'Manzil', 'Izoh'])
    expect(rows).toHaveLength(3)
    expect(rows[1]?.[1]).toBe('Karimov Aziz Akmalovich')
  })

  it('shablonda qoʻllanma varagʻi ham bor', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/import/template',
      headers: { cookie: h.cookie },
    })
    const rows = await sheetRows(r.rawPayload, 2)
    expect(rows[0]?.[0]).toBe('Bemorlarni Excel dan yuklash')
    expect(rows.flat().join(' ')).toMatch(/kun\/oy\/yil/)
  })

  // Chiqarilgan fayl aynan shablon boʻlishi kerak — uni tahrirlab qaytadan
  // yuklash mumkin (tz.md 8-boʻlim)
  it('chiqarilgan faylning ustunlari shablon bilan bir xil', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/export',
      headers: { cookie: h.cookie },
    })
    expect(r.statusCode).toBe(200)

    const rows = await sheetRows(r.rawPayload)
    expect(rows[0]).toEqual(['ID', 'F.I.O.', 'Telefon', 'Tugʻilgan sana', 'Manzil', 'Izoh'])
  })

  it('bemorlar id si bilan chiqadi, sana KK/OO/YYYY da', async () => {
    await post('/api/patients', { fio: 'Eksport Bemori', birthDate: '1990-05-12' })

    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/export',
      headers: { cookie: h.cookie },
    })
    const rows = await sheetRows(r.rawPayload)
    const row = rows.find((line) => line[1] === 'Eksport Bemori')

    expect(row?.[0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(row?.[3]).toBe('12/05/1990')
  })

  it('begona klinikaning bemori chiqmaydi', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/export',
      headers: { cookie: h.cookie },
    })
    const rows = await sheetRows(r.rawPayload)
    expect(rows.flat()).not.toContain('Begona Bemor')
  })

  it('faylni yuklab olish uchun ruxsat kerak', async () => {
    const r = await h.app.inject({ method: 'GET', url: '/api/patients/export' })
    expect(r.statusCode).toBe(401)
  })
})

describe('Excel dan yuklash', () => {
  function upload(csv: string, hasHeader = true, filename = 'bemorlar.csv') {
    const boundary = '----edentist'
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="hasHeader"\r\n\r\n${hasHeader}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: text/csv\r\n\r\n${csv}\r\n`,
      `--${boundary}--\r\n`,
    ]
    return h.app.inject({
      method: 'POST',
      url: '/api/patients/import/preview',
      headers: { cookie: h.cookie, 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: Buffer.from(parts.join('')),
    })
  }

  const commit = (token: string, mode: string) =>
    h.app.inject({
      method: 'POST',
      url: '/api/patients/import/commit',
      payload: { token, mode },
      headers: { cookie: h.cookie },
    })

  it('toʻgʻri faylni oʻqiydi va sanoqni qaytaradi', async () => {
    const r = await upload(
      'F.I.O.;Telefon;Tugʻilgan sana\nImport Birinchi;901110001;12/05/1990\nImport Ikkinchi;901110002;',
    )
    expect(r.statusCode).toBe(200)
    const data = r.json().data
    expect(data.totalRows).toBe(2)
    expect(data.validCount).toBe(2)
    expect(data.errorCount).toBe(0)
    expect(data.rows[0].values).toMatchObject({
      fio: 'Import Birinchi',
      phone: '+998901110001',
      birthDate: '1990-05-12',
    })
  })

  it('F.I.O. ustuni yoʻq boʻlsa aniq yoʻriqnoma beradi', async () => {
    const r = await upload('Telefon;Manzil\n901110003;Toshkent')
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/Shablonni yuklab olib/)
  })

  it('xatoli qatorni belgilaydi, qolganini toʻgʻri deb hisoblaydi', async () => {
    const r = await upload('F.I.O.;Tugʻilgan sana\nYaxshi Bemor;01/01/2000\nAb;kecha')
    const data = r.json().data
    expect(data.validCount).toBe(1)
    expect(data.errorCount).toBe(1)
    expect(data.rows[1].errors).toMatchObject({
      fio: expect.any(String),
      birthDate: expect.any(String),
    })
    // Qator raqami Excel dagidek: sarlavha 1-qator
    expect(data.rows[1].row).toBe(3)
  })

  it('qatorlar yoziladi', async () => {
    const preview = await upload('F.I.O.;Telefon\nYangi Import;901110010')
    const r = await commit(preview.json().data.token, 'skip')
    expect(r.json().data).toMatchObject({ added: 1, updated: 0, skipped: 0 })

    const list = await get('/api/patients?q=Yangi Import')
    expect(list.json().data.items[0].phone).toBe('+998901110010')
  })

  describe('takrorlar', () => {
    beforeAll(async () => {
      await post('/api/patients', { fio: 'Takror Bemor', phone: '901119999' })
    })

    it('telefon boʻyicha takror aniqlanadi', async () => {
      const r = await upload('F.I.O.;Telefon\nBoshqa Ism;901119999')
      expect(r.json().data.duplicateCount).toBe(1)
      expect(r.json().data.rows[0].duplicateOf).toBeTruthy()
    })

    it('«oʻtkazib yuborish» — yozilmaydi', async () => {
      const preview = await upload('F.I.O.;Telefon\nBoshqa Ism;901119999')
      const r = await commit(preview.json().data.token, 'skip')
      expect(r.json().data).toMatchObject({ added: 0, skipped: 1 })
    })

    it('«mavjudini yangilash» — eski yozuv oʻzgaradi', async () => {
      const preview = await upload('F.I.O.;Telefon\nYangilangan Ism;901119999')
      const r = await commit(preview.json().data.token, 'update')
      expect(r.json().data).toMatchObject({ added: 0, updated: 1 })

      const list = await get('/api/patients?q=901119999')
      expect(list.json().data.items[0].fio).toBe('Yangilangan Ism')
    })

    it('«baribir qoʻshish» — ikkinchi yozuv paydo boʻladi', async () => {
      const preview = await upload('F.I.O.;Telefon\nUchinchi Ism;901119999')
      const r = await commit(preview.json().data.token, 'add')
      expect(r.json().data).toMatchObject({ added: 1 })

      const list = await get('/api/patients?q=901119999')
      expect(list.json().data.total).toBe(2)
    })
  })

  it('xatoli qatorlar alohida faylga chiqadi', async () => {
    const preview = await upload('F.I.O.;Tugʻilgan sana\nAb;kecha')
    const result = await commit(preview.json().data.token, 'skip')
    const token = result.json().data.errorsToken
    expect(token).toBeTruthy()

    const file = await h.app.inject({
      method: 'GET',
      url: `/api/patients/import/errors/${token}`,
      headers: { cookie: h.cookie },
    })
    expect(file.statusCode).toBe(200)

    const rows = await sheetRows(file.rawPayload)
    expect(rows[0]?.slice(0, 2)).toEqual(['Qator', 'Xato'])
    expect(String(rows[1]?.[1])).toMatch(/kamida 3/)
  })

  it('eskirgan yoki begona token rad etiladi', async () => {
    const r = await commit('bunday-token-yoq', 'skip')
    expect(r.statusCode).toBe(400)
    expect(r.json().error.message).toMatch(/seansi eskirdi/)
  })

  // TZ ning asosiy vaʼdasi: chiqarilgan faylni tahrirlab qaytadan yuklash
  // mumkin — bu koʻp yozuvni birdaniga tuzatishning eng oson yoʻli
  it('chiqarilgan faylni qaytadan yuklab boʻladi va id boʻyicha yangilanadi', async () => {
    const created = await post('/api/patients', { fio: 'Aylanma Bemor', phone: '901112222' })
    const id = created.json().data.id

    const exported = await h.app.inject({
      method: 'GET',
      url: '/api/patients/export',
      headers: { cookie: h.cookie },
    })
    const rows = await sheetRows(exported.rawPayload)
    const header = rows[0] as string[]
    const mine = rows.find((line) => line[1] === 'Aylanma Bemor') as string[]
    expect(mine[0]).toBe(id)

    // Excelda tahrirlangandek: ismni oʻzgartiramiz
    const edited = [
      header.join(';'),
      [id, 'Aylanma Tuzatilgan', mine[2], mine[3], '', ''].join(';'),
    ]
    const preview = await upload(edited.join('\n'))
    expect(preview.json().data.errorCount).toBe(0)

    const result = await commit(preview.json().data.token, 'skip')
    expect(result.json().data).toMatchObject({ added: 0, updated: 1 })

    const check = await get(`/api/patients/${id}`)
    expect(check.json().data.fio).toBe('Aylanma Tuzatilgan')
  })

  it('notoʻgʻri ID li qator xato beradi', async () => {
    const r = await upload('ID;F.I.O.\n00000000-0000-7000-8000-00000000dead;Yoʻq Bemor')
    expect(r.json().data.rows[0].errors.id).toBe('Bunday ID li bemor topilmadi')
  })
})
