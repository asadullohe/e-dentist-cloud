// Namuna klinika «Tabassum Dental» — ishlab turgan klinikaga oʻxshash
// maʼlumot: xodimlar, katalog, bemorlar, uch oylik tarix, jadval, rejalar.
//
//   npm run db:demo              — yaratadi
//   npm run db:demo -- --reset   — eskisini oʻchirib, qaytadan yaratadi
//
// Maʼlumot lokal API orqali kiritiladi (API ishlab turishi kerak). Bazaga
// toʻgʻridan-toʻgʻri faqat API qoʻymaydigan narsa yoziladi: pochta tasdigʻi,
// oʻtgan sanadagi `created_at` va obuna muddati

import { createDb } from '../../src/platform/db.js'
import { apiIsUp, Client, daysFromToday, publicPost } from './client.js'
import { type Ctx, type ServiceRef, Slots } from './context.js'
import { CATALOG, CLINIC, PASSWORD, rng, STAFF, type StaffKey } from './data.js'
import { createHistory } from './history.js'
import { createExpenses, payOut } from './money.js'
import { clearDemoLimits, removeDemoClinic } from './reset.js'
import { createFeedback, createLabOrders, createPlans, createSchedule } from './schedule.js'

const MONTHS = 3
const PATIENTS = 170

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Namuna klinika faqat lokal muhitda yaratiladi')
  }
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL berilmagan')
  if (!(await apiIsUp())) {
    throw new Error('API javob bermayapti — avval `npm run dev` bilan ishga tushiring')
  }

  const db = createDb(url)
  const ownerSpec = STAFF[0]
  if (!ownerSpec) throw new Error('Egasi berilmagan')
  if (process.argv.includes('--reset')) {
    if (await removeDemoClinic(db, CLINIC.name)) console.log(`Eski «${CLINIC.name}» oʻchirildi`)
    if (process.env.REDIS_URL) await clearDemoLimits(process.env.REDIS_URL)
  }
  if (await db.user.findUnique({ where: { email: ownerSpec.email } })) {
    throw new Error(
      `${ownerSpec.email} allaqachon bor — qaytadan yaratish: npm run db:demo -- --reset`,
    )
  }

  // Egasi oʻzi roʻyxatdan oʻtadi, pochta tasdigʻi bazada qoʻyiladi
  const owner = new Client()
  const { clinicId } = await publicPost<{ clinicId: string }>('/auth/register', {
    clinicName: CLINIC.name,
    phone: CLINIC.phone,
    fullName: ownerSpec.fullName,
    email: ownerSpec.email,
    password: PASSWORD,
  })
  // Klinika uch oy oldin, oyning birinchi kunidan ishlaydi (joriy oy ham kiradi)
  const startedAt = daysFromToday(0)
  startedAt.setDate(1)
  startedAt.setMonth(startedAt.getMonth() - (MONTHS - 1))
  await db.$executeRaw`UPDATE users SET email_verified_at = now() WHERE email = ${ownerSpec.email}`
  // Sinov emas, toʻlangan obuna — sinov banneri chiqmasin
  await db.clinic.update({
    where: { id: clinicId },
    data: { isTrial: false, expiresAt: daysFromToday(365), createdAt: startedAt },
  })
  await owner.login(ownerSpec.email, PASSWORD)
  console.log(`Klinika: ${CLINIC.name}`)

  const roles = await owner.get<{ id: string; template: string }[]>('/roles')
  const staff = {} as Record<StaffKey, string>
  const me = await owner.get<{ user: { id: string } }>('/me')
  staff.owner = me.user.id
  for (const s of STAFF.slice(1)) {
    const role = roles.find((r) => r.template === s.template)
    if (!role) throw new Error(`Rol topilmadi: ${s.template}`)
    const created = await owner.post<{ id: string }>('/staff', {
      email: s.email,
      fullName: s.fullName,
      roleId: role.id,
      password: PASSWORD,
      salaryAmount: s.salaryAmount,
      payPercent: s.payPercent,
    })
    staff[s.key] = created.id
  }
  // Oylik xodim qoʻshilgan oydan hisoblanadi — hamma boshidan ishlagan
  await db.$executeRaw`UPDATE users SET created_at = ${startedAt} WHERE clinic_id = ${clinicId}::uuid`
  console.log(`Xodimlar: ${STAFF.length}`)

  await owner.patch('/clinic/public', {
    publicPhone: CLINIC.publicPhone,
    address: CLINIC.address,
    reviewUrl: '',
  })

  const services: Record<string, ServiceRef> = {}
  for (const group of CATALOG) {
    const type = await owner.post<{ id: string }>('/service-types', { name: group.type })
    for (const s of group.services) {
      const created = await owner.post<{ id: string }>('/services', {
        typeId: type.id,
        name: s.name,
        price: s.price,
        area: s.area,
        techPrice: s.techPrice,
      })
      services[s.key] = { id: created.id, ...s }
    }
  }
  console.log(`Xizmatlar: ${Object.keys(services).length}`)

  const sardor = new Client()
  await sardor.login('sardor@tabassum.uz', PASSWORD)
  const bobur = new Client()
  await bobur.login('bobur@tabassum.uz', PASSWORD)

  const ctx: Ctx = {
    db,
    clinicId,
    owner,
    sardor,
    bobur,
    staff,
    services,
    slots: new Slots(),
    rand: rng(20260924),
  }

  const patients = await createHistory(ctx, PATIENTS, startedAt)
  console.log(`Bemorlar va tarix: ${patients.length}`)
  await createSchedule(ctx, patients)
  await createLabOrders(ctx, patients)
  await createPlans(ctx, patients)
  console.log('Jadval, naryadlar, rejalar')
  await createExpenses(ctx, MONTHS - 1)
  await payOut(ctx, MONTHS - 1)
  console.log('Xarajatlar va ish haqi')

  const clinic = await db.clinic.findUniqueOrThrow({ where: { id: clinicId } })
  await createFeedback(ctx, clinic.queueCode)
  console.log('Bemor fikrlari')

  console.log(`\nKirish: ${ownerSpec.email} / ${PASSWORD}`)
  console.log('Boshqa xodimlar: dilnoza@, sardor@, malika@, bobur@, nodira@tabassum.uz')
  await db.$disconnect()
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
