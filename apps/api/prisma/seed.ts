// Ishlab chiqish uchun boshlangʻich maʼlumot: bitta namuna klinika va unga
// nusxalangan beshta rol shabloni.
//
// Rol shablonlari bazada emas, kodda turadi (packages/shared/rollar.ts):
// ular har klinikaga nusxalanadi va oʻsha klinikaniki boʻlib qoladi, shuning
// uchun «umumiy shablon qatori» degan tushuncha kerak emas.

import { ROL_SHABLONI_TAVSIFI, ROL_SHABLONLARI } from '@e-dentist/shared'
import { yaratDb } from '../src/platform/db.js'

const DEMO_KLINIKA_ID = '00000000-0000-7000-8000-000000000001'
const SINOV_KUNI = 14

function sinovTugashSanasi(): Date {
  const d = new Date()
  d.setDate(d.getDate() + SINOV_KUNI)
  d.setHours(0, 0, 0, 0)
  return d
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed faqat ishlab chiqish muhitida ishlaydi — u namuna maʼlumot yozadi')
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL berilmagan')

  const db = yaratDb(url)

  const klinika = await db.clinic.upsert({
    where: { id: DEMO_KLINIKA_ID },
    create: {
      id: DEMO_KLINIKA_ID,
      name: 'Namuna stomatologiya',
      phone: '+998901234567',
      isTrial: true,
      expiresAt: sinovTugashSanasi(),
    },
    update: {},
  })

  for (const shablon of ROL_SHABLONLARI) {
    const tavsif = ROL_SHABLONI_TAVSIFI[shablon]
    await db.role.upsert({
      where: { clinicId_template: { clinicId: klinika.id, template: shablon } },
      create: {
        clinicId: klinika.id,
        template: shablon,
        name: tavsif.nom,
        permissions: [...tavsif.ruxsatlar],
        isOwner: tavsif.isOwner,
      },
      // Shablon kodda oʻzgarsa, mavjud klinikada ham yangilansin
      update: {
        name: tavsif.nom,
        permissions: [...tavsif.ruxsatlar],
        isOwner: tavsif.isOwner,
      },
    })
  }

  const rollar = await db.role.findMany({
    where: { clinicId: klinika.id },
    orderBy: { template: 'asc' },
  })

  console.log(`Klinika: ${klinika.name}`)
  console.log(`Sinov tugaydi: ${klinika.expiresAt.toISOString().slice(0, 10)}`)
  console.log(`Rollar (${rollar.length}):`)
  for (const r of rollar) {
    console.log(`  ${r.name.padEnd(12)} ${r.permissions.length} ruxsat`)
  }

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
