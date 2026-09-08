// Koʻp ijarachilikning birinchi himoya qatlami.
//
// Uch qatlam bor (tz.md 5-boʻlim):
//   1. Shu fayl — har soʻrovga clinicId avtomatik qoʻshiladi
//   2. Postgres RLS — sessiya oʻzgaruvchisiga bogʻlangan siyosatlar
//   3. Har modul uchun test — «A klinikaning sessiyasi bilan B ning yozuvi»
//
// Nega ikkalasi ham kerak: kengaytma dastur ichida ishlaydi va xom SQL yozilsa
// chetlab oʻtiladi; RLS esa bazada turadi, lekin u bilan kod xatosi yashirin
// qolib ketishi mumkin — kengaytma xatoni darhol koʻrsatadi.

import type { Db } from './db.js'

/// clinic_id ustuni orqali bogʻlangan modellar.
///
/// Yangi jadval qoʻshilganda IKKI joyni yangilash shart: shu roʻyxat va
/// migratsiyadagi RLS siyosati. Bittasi unutilsa himoya bir qatlamga tushadi,
/// lekin hech qanday xato koʻrinmaydi — shuning uchun tenant.test.ts da
/// ikkalasini ham tekshiradigan test bor
export const TENANT_MODELS = new Set([
  'User',
  'Role',
  'Invite',
  'AuditLog',
  'Patient',
  'Visit',
  'Tooth',
  'Bridge',
  'Payment',
  'Appointment',
  'Service',
  'PatientImage',
  'Expense',
  'LabOrder',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'aggregate',
  'count',
  'groupBy',
])

/// Klinika modelida ijarachi ustuni — `id` ning oʻzi
function tenantField(model: string | undefined): 'id' | 'clinicId' | null {
  if (model === 'Clinic') return 'id'
  return model && TENANT_MODELS.has(model) ? 'clinicId' : null
}

/// Qoʻlda boshqa klinika yozilgan boʻlsa — jimgina tuzatmaymiz, xato beramiz.
/// Jim tuzatish soʻrovni boshqa klinikaga burib yuboradi va xato koʻrinmay qoladi
function assertTenant(
  part: Record<string, unknown> | undefined,
  field: string,
  clinicId: string,
  where: string,
): Record<string, unknown> {
  const current = part?.[field]
  if (current !== undefined && current !== clinicId) {
    throw new Error(
      `Koʻp ijarachilik buzilishi: ${where} da ${field}=${String(current)}, sessiya esa ${clinicId}`,
    )
  }
  return { ...(part ?? {}), [field]: clinicId }
}

function tenantExtension(clinicId: string) {
  return {
    name: 'klinika-chegarasi',
    query: {
      $allModels: {
        // biome-ignore lint/suspicious/noExplicitAny: Prisma kengaytmasining umumiy imzosi
        async $allOperations({ model, operation, args, query }: any) {
          const field = tenantField(model)
          if (!field) return query(args)

          const next = { ...args }

          if (WHERE_OPERATIONS.has(operation)) {
            next.where = assertTenant(next.where, field, clinicId, `${model}.${operation} where`)
          }

          if (operation === 'create' || operation === 'upsert') {
            const key = operation === 'upsert' ? 'create' : 'data'
            next[key] = assertTenant(next[key], field, clinicId, `${model}.${operation}`)
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const rows = Array.isArray(next.data) ? next.data : [next.data]
            next.data = rows.map((q: Record<string, unknown>) =>
              assertTenant(q, field, clinicId, `${model}.${operation}`),
            )
          }

          // Yangilashda ijarachi ustunini oʻzgartirib boʻlmaydi: yozuvni boshqa
          // klinikaga koʻchirish — hech qachon toʻgʻri amal emas
          if ((operation === 'update' || operation === 'updateMany') && next.data) {
            const d = next.data as Record<string, unknown>
            if (d[field] !== undefined && d[field] !== clinicId) {
              throw new Error(`Koʻp ijarachilik buzilishi: ${model} ni boshqa klinikaga koʻchirish`)
            }
          }

          return query(next)
        },
      },
    },
  }
}

export type ClinicTx = Parameters<Parameters<Db['$transaction']>[0]>[0]

/// `create` da clinicId ni yozdirmaslik uchun.
///
/// Ish vaqtida uni yuqoridagi kengaytma qoʻyadi, lekin Prisma tipi uni talab
/// qiladi. Shuning uchun bitta nomlangan joyda, izoh bilan olib tashlanadi —
/// aks holda modullar boʻylab `as any` sochilib ketardi va oʻsha paytda
/// haqiqiy tip xatolari ham yashirinib qolardi.
export function tenantScoped<T extends object>(data: T): T & { clinicId: string } {
  return data as T & { clinicId: string }
}

/// Bitta klinika nomidan ish bajaradi.
///
/// Ichida tranzaksiya ochiladi va `app.clinic_id` sessiya oʻzgaruvchisi
/// oʻrnatiladi — RLS siyosatlari aynan shunga qaraydi. Oʻzgaruvchi tranzaksiya
/// bilan birga tugaydi (set_config uchinchi argumenti = true), shuning uchun
/// ulanish hovuzida keyingi soʻrovga sizib oʻtmaydi.
export async function withClinic<T>(
  db: Db,
  clinicId: string,
  fn: (tx: ClinicTx) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(clinicId)) {
    throw new Error(`clinicId uuid koʻrinishida emas: ${clinicId}`)
  }
  const extended = db.$extends(tenantExtension(clinicId))
  return extended.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.clinic_id', ${clinicId}, true)`
    return fn(tx as unknown as ClinicTx)
  }) as Promise<T>
}
