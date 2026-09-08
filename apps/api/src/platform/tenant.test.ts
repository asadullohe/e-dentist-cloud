// Koʻp ijarachilikning uchinchi qatlami: «A klinikaning sessiyasi bilan
// B ning yozuvini soʻrash». Bu test har yangi modul uchun takrorlanadi.
//
// Haqiqiy bazaga ulanadi — RLS ni soxta obyekt bilan tekshirib boʻlmaydi.
// Ikkita ulanish ishlatiladi:
//   ega  — superuser, sinov maʼlumotini tayyorlaydi (RLS unga taʼsir qilmaydi)
//   app  — cheklangan foydalanuvchi, ilova aynan shu bilan ishlaydi

import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateQueueCode } from '../modules/clinics/queueCode.js'
import { createDb, type Db } from './db.js'
import { TENANT_MODELS, tenantScoped, withClinic } from './tenant.js'

const ownerUrl = process.env.DATABASE_URL
const appUrl = process.env.APP_DATABASE_URL
if (!ownerUrl || !appUrl) {
  throw new Error('DATABASE_URL va APP_DATABASE_URL kerak — «npm run up» bilan bazani koʻtaring')
}

let ownerDb: Db
let app: Db

const A = randomUUID()
const B = randomUUID()
let roleAId = ''
let roleBId = ''

function testDate(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

beforeAll(async () => {
  ownerDb = createDb(ownerUrl as string)
  app = createDb(appUrl as string)

  for (const [id, label] of [
    [A, 'A klinikasi'],
    [B, 'B klinikasi'],
  ] as const) {
    await ownerDb.clinic.create({
      data: { id, name: label, expiresAt: testDate(), queueCode: generateQueueCode() },
    })
  }

  const a = await ownerDb.role.create({
    data: { clinicId: A, template: 'shifokor', name: 'Shifokor', permissions: ['patients.read'] },
  })
  const b = await ownerDb.role.create({
    data: { clinicId: B, template: 'shifokor', name: 'Shifokor', permissions: ['patients.read'] },
  })
  roleAId = a.id
  roleBId = b.id
})

afterAll(async () => {
  await ownerDb.role.deleteMany({ where: { clinicId: { in: [A, B] } } })
  await ownerDb.clinic.deleteMany({ where: { id: { in: [A, B] } } })
  await ownerDb.$disconnect()
  await app.$disconnect()
})

describe('repozitoriya qatlami — clinicId avtomatik qoʻshiladi', () => {
  it('roʻyxatda faqat oʻz klinikasining yozuvlari koʻrinadi', async () => {
    const roles = await withClinic(app, A, (tx) => tx.role.findMany())
    expect(roles).toHaveLength(1)
    expect(roles[0]?.id).toBe(roleAId)
  })

  it('begona yozuvni identifikatori boʻyicha ham topib boʻlmaydi', async () => {
    const r = await withClinic(app, A, (tx) => tx.role.findUnique({ where: { id: roleBId } }))
    expect(r).toBeNull()
  })

  it('yangi yozuvga clinicId oʻzi qoʻyiladi', async () => {
    const r = await withClinic(app, A, (tx) =>
      tx.role.create({
        data: tenantScoped({ template: 'kuzatuvchi', name: 'Kuzatuvchi', permissions: [] }),
      }),
    )
    expect(r.clinicId).toBe(A)
    await ownerDb.role.delete({ where: { id: r.id } })
  })

  it('boshqa klinika qoʻlda yozilsa — jimgina tuzatilmaydi, xato beriladi', async () => {
    await expect(
      withClinic(app, A, (tx) =>
        tx.role.create({
          data: { clinicId: B, template: 'texnik', name: 'Texnik', permissions: [] },
        }),
      ),
    ).rejects.toThrow(/Koʻp ijarachilik buzilishi/)
  })

  it('yozuvni boshqa klinikaga koʻchirib boʻlmaydi', async () => {
    await expect(
      withClinic(app, A, (tx) => tx.role.update({ where: { id: roleAId }, data: { clinicId: B } })),
    ).rejects.toThrow(/Koʻp ijarachilik buzilishi/)
  })

  // Bu test yuqoridagilarning yolgʻon oʻtishidan saqlaydi: agar `update`
  // umuman ishlamasa, «begona yozuvni oʻzgartirib boʻlmaydi» testi ham
  // oʻtardi — lekin sababi butunlay boshqa boʻlardi
  it('oʻz yozuvini esa oʻzgartira oladi', async () => {
    const r = await withClinic(app, A, (tx) =>
      tx.role.update({ where: { id: roleAId }, data: { name: 'Bosh shifokor' } }),
    )
    expect(r.name).toBe('Bosh shifokor')
    await ownerDb.role.update({ where: { id: roleAId }, data: { name: 'Shifokor' } })
  })

  it('begona yozuvni oʻzgartirib boʻlmaydi', async () => {
    await expect(
      withClinic(app, A, (tx) =>
        tx.role.update({ where: { id: roleBId }, data: { name: 'buzildi' } }),
      ),
    ).rejects.toThrow()

    const b = await ownerDb.role.findUnique({ where: { id: roleBId } })
    expect(b?.name).toBe('Shifokor')
  })

  it('begona yozuvni oʻchirib boʻlmaydi', async () => {
    await withClinic(app, A, (tx) => tx.role.deleteMany({ where: { id: roleBId } }))
    const b = await ownerDb.role.findUnique({ where: { id: roleBId } })
    expect(b).not.toBeNull()
  })

  it('uuid boʻlmagan clinicId rad etiladi', async () => {
    await expect(withClinic(app, "' OR 1=1 --", (tx) => tx.role.findMany())).rejects.toThrow(
      /uuid koʻrinishida emas/,
    )
  })
})

describe('Postgres RLS — xom SQL ham himoyalangan', () => {
  it('sessiya ichidagi xom soʻrov ham faqat oʻz klinikasini koʻradi', async () => {
    const rows = await withClinic(
      app,
      A,
      (tx) => tx.$queryRaw<{ id: string }[]>`SELECT id FROM roles`,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe(roleAId)
  })

  it('kontekstsiz hech narsa koʻrinmaydi — «ochiq qolish» emas, «yopiq qolish»', async () => {
    const rows = await app.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM roles`
    expect(Number(rows[0]?.n)).toBe(0)
  })

  it('egasi (migratsiya ulanishi) RLS dan ozod — seed va migratsiya ishlashi uchun', async () => {
    const everything = await ownerDb.role.findMany({ where: { clinicId: { in: [A, B] } } })
    expect(everything).toHaveLength(2)
  })
})

// Bu ikki test qatlamlardan biri unutilib qolishidan saqlaydi. Yangi jadval
// qoʻshilganda RLS siyosati ham, TENANT_MODELS ham yangilanishi kerak —
// bittasi unutilsa hech qanday xato koʻrinmaydi, faqat himoya kamayadi
describe('koʻp ijarachilik qamrovi', () => {
  it('clinic_id ustuni bor har bir jadvalda RLS yoqilgan va siyosati bor', async () => {
    const rows = await ownerDb.$queryRaw<{ table_name: string; has_policy: boolean }[]>`
      SELECT c.relname AS table_name,
             c.relrowsecurity AND EXISTS (
               SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
             ) AS has_policy
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = c.oid AND a.attname = 'clinic_id' AND NOT a.attisdropped
        )
      ORDER BY c.relname`

    const unprotected = rows.filter((r) => !r.has_policy).map((r) => r.table_name)
    expect(unprotected).toEqual([])
    // Jadvallar qoʻshilgani sayin bu son oʻsadi — nolga tushib qolmasin
    expect(rows.length).toBeGreaterThanOrEqual(12)
  })

  it('TENANT_MODELS bazadagi ijarachi jadvallari bilan bir xil sonda', async () => {
    const rows = await ownerDb.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = c.oid AND a.attname = 'clinic_id' AND NOT a.attisdropped
        )`
    // clinics jadvalining oʻzida clinic_id yoʻq (u `id` orqali bogʻlanadi),
    // shuning uchun TENANT_MODELS dan bitta kam chiqadi
    expect(Number(rows[0]?.n)).toBe(TENANT_MODELS.size)
  })
})
