import { Redis } from 'ioredis'
import type { Db } from '../../src/platform/db.js'

/// Namuna klinikani butunlay oʻchiradi (`--reset`). Faqat shu klinika:
/// `clinic_id` ustuni bor har jadvaldan, keyin xodimlar, rollar va klinika
export async function removeDemoClinic(db: Db, name: string): Promise<boolean> {
  const found = await db.clinic.findFirst({ where: { name }, select: { id: true } })
  if (!found) return false
  const tables = await db.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'clinic_id' AND table_schema = 'public'
      AND table_name NOT IN ('users', 'roles')`
  await db.$transaction(async (tx) => {
    // Jadvallar bir-biriga bogʻlangan va tartibi nomaʼlum — FK triggerlari shu
    // tranzaksiyada oʻchiriladi. Hammasi bitta klinikaniki, yetim qator qolmaydi.
    // Lokal superuser (DATABASE_URL) kerak
    await tx.$executeRawUnsafe('SET LOCAL session_replication_role = replica')
    for (const { table_name } of tables) {
      await tx.$executeRawUnsafe(`DELETE FROM "${table_name}" WHERE clinic_id = $1::uuid`, found.id)
    }
    await tx.$executeRaw`DELETE FROM users WHERE clinic_id = ${found.id}::uuid`
    await tx.$executeRaw`DELETE FROM roles WHERE clinic_id = ${found.id}::uuid`
    await tx.$executeRaw`DELETE FROM clinics WHERE id = ${found.id}::uuid`
  })
  return true
}

/// Roʻyxatdan oʻtish (IP ga sutkada 3 ta), kirish (hisobga 15 daqiqada 5 ta)
/// va fikr (IP ga soatiga 10 ta) cheklovlari — qayta yaratishda tozalanadi, aks holda ikkinchi-uchinchi
/// `--reset` dan keyin skript toʻxtab qoladi
export async function clearDemoLimits(redisUrl: string): Promise<void> {
  const redis = new Redis(redisUrl)
  try {
    const keys = [
      ...(await redis.keys('ratelimit:register:ip:*')),
      ...(await redis.keys('ratelimit:login:*')),
      ...(await redis.keys('ratelimit:feedback:*')),
    ]
    if (keys.length > 0) await redis.del(...keys)
  } finally {
    redis.disconnect()
  }
}
