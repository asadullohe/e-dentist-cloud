// Koʻp ijarachilikning uchinchi qatlami: «A klinikaning sessiyasi bilan
// B ning yozuvini soʻrash». Bu test har yangi modul uchun takrorlanadi.
//
// Haqiqiy bazaga ulanadi — RLS ni soxta obyekt bilan tekshirib boʻlmaydi.
// Ikkita ulanish ishlatiladi:
//   ega  — superuser, sinov maʼlumotini tayyorlaydi (RLS unga taʼsir qilmaydi)
//   app  — cheklangan foydalanuvchi, ilova aynan shu bilan ishlaydi

import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Db, yaratDb } from './db.js'
import { ijarachisiz, klinikaSessiyasi } from './tenant.js'

const egaUrl = process.env.DATABASE_URL
const appUrl = process.env.APP_DATABASE_URL
if (!egaUrl || !appUrl) {
  throw new Error('DATABASE_URL va APP_DATABASE_URL kerak — «npm run up» bilan bazani koʻtaring')
}

let ega: Db
let app: Db

const A = randomUUID()
const B = randomUUID()
let aRolId = ''
let bRolId = ''

function sinovSanasi(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

beforeAll(async () => {
  ega = yaratDb(egaUrl as string)
  app = yaratDb(appUrl as string)

  for (const [id, nom] of [
    [A, 'A klinikasi'],
    [B, 'B klinikasi'],
  ] as const) {
    await ega.clinic.create({ data: { id, name: nom, expiresAt: sinovSanasi() } })
  }

  const a = await ega.role.create({
    data: { clinicId: A, template: 'shifokor', name: 'Shifokor', permissions: ['patients.read'] },
  })
  const b = await ega.role.create({
    data: { clinicId: B, template: 'shifokor', name: 'Shifokor', permissions: ['patients.read'] },
  })
  aRolId = a.id
  bRolId = b.id
})

afterAll(async () => {
  await ega.role.deleteMany({ where: { clinicId: { in: [A, B] } } })
  await ega.clinic.deleteMany({ where: { id: { in: [A, B] } } })
  await ega.$disconnect()
  await app.$disconnect()
})

describe('repozitoriya qatlami — clinicId avtomatik qoʻshiladi', () => {
  it('roʻyxatda faqat oʻz klinikasining yozuvlari koʻrinadi', async () => {
    const rollar = await klinikaSessiyasi(app, A, (tx) => tx.role.findMany())
    expect(rollar).toHaveLength(1)
    expect(rollar[0]?.id).toBe(aRolId)
  })

  it('begona yozuvni identifikatori boʻyicha ham topib boʻlmaydi', async () => {
    const r = await klinikaSessiyasi(app, A, (tx) => tx.role.findUnique({ where: { id: bRolId } }))
    expect(r).toBeNull()
  })

  it('yangi yozuvga clinicId oʻzi qoʻyiladi', async () => {
    const r = await klinikaSessiyasi(app, A, (tx) =>
      tx.role.create({
        data: ijarachisiz({ template: 'kuzatuvchi', name: 'Kuzatuvchi', permissions: [] }),
      }),
    )
    expect(r.clinicId).toBe(A)
    await ega.role.delete({ where: { id: r.id } })
  })

  it('boshqa klinika qoʻlda yozilsa — jimgina tuzatilmaydi, xato beriladi', async () => {
    await expect(
      klinikaSessiyasi(app, A, (tx) =>
        tx.role.create({
          data: { clinicId: B, template: 'texnik', name: 'Texnik', permissions: [] },
        }),
      ),
    ).rejects.toThrow(/Koʻp ijarachilik buzilishi/)
  })

  it('yozuvni boshqa klinikaga koʻchirib boʻlmaydi', async () => {
    await expect(
      klinikaSessiyasi(app, A, (tx) =>
        tx.role.update({ where: { id: aRolId }, data: { clinicId: B } }),
      ),
    ).rejects.toThrow(/Koʻp ijarachilik buzilishi/)
  })

  // Bu test yuqoridagilarning yolgʻon oʻtishidan saqlaydi: agar `update`
  // umuman ishlamasa, «begona yozuvni oʻzgartirib boʻlmaydi» testi ham
  // oʻtardi — lekin sababi butunlay boshqa boʻlardi
  it('oʻz yozuvini esa oʻzgartira oladi', async () => {
    const r = await klinikaSessiyasi(app, A, (tx) =>
      tx.role.update({ where: { id: aRolId }, data: { name: 'Bosh shifokor' } }),
    )
    expect(r.name).toBe('Bosh shifokor')
    await ega.role.update({ where: { id: aRolId }, data: { name: 'Shifokor' } })
  })

  it('begona yozuvni oʻzgartirib boʻlmaydi', async () => {
    await expect(
      klinikaSessiyasi(app, A, (tx) =>
        tx.role.update({ where: { id: bRolId }, data: { name: 'buzildi' } }),
      ),
    ).rejects.toThrow()

    const b = await ega.role.findUnique({ where: { id: bRolId } })
    expect(b?.name).toBe('Shifokor')
  })

  it('begona yozuvni oʻchirib boʻlmaydi', async () => {
    await klinikaSessiyasi(app, A, (tx) => tx.role.deleteMany({ where: { id: bRolId } }))
    const b = await ega.role.findUnique({ where: { id: bRolId } })
    expect(b).not.toBeNull()
  })

  it('uuid boʻlmagan clinicId rad etiladi', async () => {
    await expect(klinikaSessiyasi(app, "' OR 1=1 --", (tx) => tx.role.findMany())).rejects.toThrow(
      /uuid koʻrinishida emas/,
    )
  })
})

describe('Postgres RLS — xom SQL ham himoyalangan', () => {
  it('sessiya ichidagi xom soʻrov ham faqat oʻz klinikasini koʻradi', async () => {
    const qatorlar = await klinikaSessiyasi(
      app,
      A,
      (tx) => tx.$queryRaw<{ id: string }[]>`SELECT id FROM roles`,
    )
    expect(qatorlar).toHaveLength(1)
    expect(qatorlar[0]?.id).toBe(aRolId)
  })

  it('kontekstsiz hech narsa koʻrinmaydi — «ochiq qolish» emas, «yopiq qolish»', async () => {
    const qatorlar = await app.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM roles`
    expect(Number(qatorlar[0]?.n)).toBe(0)
  })

  it('egasi (migratsiya ulanishi) RLS dan ozod — seed va migratsiya ishlashi uchun', async () => {
    const hammasi = await ega.role.findMany({ where: { clinicId: { in: [A, B] } } })
    expect(hammasi).toHaveLength(2)
  })
})
