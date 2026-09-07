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

/// clinic_id ustuni orqali bogʻlangan modellar. Yangi modul qoʻshilganda
/// bu roʻyxatga ham qoʻshilishi shart
const IJARACHI_MODELLAR = new Set(['User', 'Role', 'Invite', 'AuditLog'])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const WHERE_AMALLARI = new Set([
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
function ijarachiMaydoni(model: string | undefined): 'id' | 'clinicId' | null {
  if (model === 'Clinic') return 'id'
  return model && IJARACHI_MODELLAR.has(model) ? 'clinicId' : null
}

/// Qoʻlda boshqa klinika yozilgan boʻlsa — jimgina tuzatmaymiz, xato beramiz.
/// Jim tuzatish soʻrovni boshqa klinikaga burib yuboradi va xato koʻrinmay qoladi
function tekshirVaQoy(
  qism: Record<string, unknown> | undefined,
  maydon: string,
  clinicId: string,
  qayer: string,
): Record<string, unknown> {
  const joriy = qism?.[maydon]
  if (joriy !== undefined && joriy !== clinicId) {
    throw new Error(
      `Koʻp ijarachilik buzilishi: ${qayer} da ${maydon}=${String(joriy)}, sessiya esa ${clinicId}`,
    )
  }
  return { ...(qism ?? {}), [maydon]: clinicId }
}

function kengaytma(clinicId: string) {
  return {
    name: 'klinika-chegarasi',
    query: {
      $allModels: {
        // biome-ignore lint/suspicious/noExplicitAny: Prisma kengaytmasining umumiy imzosi
        async $allOperations({ model, operation, args, query }: any) {
          const maydon = ijarachiMaydoni(model)
          if (!maydon) return query(args)

          const yangi = { ...args }

          if (WHERE_AMALLARI.has(operation)) {
            yangi.where = tekshirVaQoy(yangi.where, maydon, clinicId, `${model}.${operation} where`)
          }

          if (operation === 'create' || operation === 'upsert') {
            const kalit = operation === 'upsert' ? 'create' : 'data'
            yangi[kalit] = tekshirVaQoy(yangi[kalit], maydon, clinicId, `${model}.${operation}`)
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            const qatorlar = Array.isArray(yangi.data) ? yangi.data : [yangi.data]
            yangi.data = qatorlar.map((q: Record<string, unknown>) =>
              tekshirVaQoy(q, maydon, clinicId, `${model}.${operation}`),
            )
          }

          // Yangilashda ijarachi ustunini oʻzgartirib boʻlmaydi: yozuvni boshqa
          // klinikaga koʻchirish — hech qachon toʻgʻri amal emas
          if ((operation === 'update' || operation === 'updateMany') && yangi.data) {
            const d = yangi.data as Record<string, unknown>
            if (d[maydon] !== undefined && d[maydon] !== clinicId) {
              throw new Error(`Koʻp ijarachilik buzilishi: ${model} ni boshqa klinikaga koʻchirish`)
            }
          }

          return query(yangi)
        },
      },
    },
  }
}

export type KlinikaTx = Parameters<Parameters<Db['$transaction']>[0]>[0]

/// `create` da clinicId ni yozdirmaslik uchun.
///
/// Ish vaqtida uni yuqoridagi kengaytma qoʻyadi, lekin Prisma tipi uni talab
/// qiladi. Shuning uchun bitta nomlangan joyda, izoh bilan olib tashlanadi —
/// aks holda modullar boʻylab `as any` sochilib ketardi va oʻsha paytda
/// haqiqiy tip xatolari ham yashirinib qolardi.
export function ijarachisiz<T extends object>(data: T): T & { clinicId: string } {
  return data as T & { clinicId: string }
}

/// Bitta klinika nomidan ish bajaradi.
///
/// Ichida tranzaksiya ochiladi va `app.clinic_id` sessiya oʻzgaruvchisi
/// oʻrnatiladi — RLS siyosatlari aynan shunga qaraydi. Oʻzgaruvchi tranzaksiya
/// bilan birga tugaydi (set_config uchinchi argumenti = true), shuning uchun
/// ulanish hovuzida keyingi soʻrovga sizib oʻtmaydi.
export async function klinikaSessiyasi<T>(
  db: Db,
  clinicId: string,
  ish: (tx: KlinikaTx) => Promise<T>,
): Promise<T> {
  if (!UUID_RE.test(clinicId)) {
    throw new Error(`clinicId uuid koʻrinishida emas: ${clinicId}`)
  }
  const kengaytirilgan = db.$extends(kengaytma(clinicId))
  return kengaytirilgan.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.clinic_id', ${clinicId}, true)`
    return ish(tx as unknown as KlinikaTx)
  }) as Promise<T>
}
