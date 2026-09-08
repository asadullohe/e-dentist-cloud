// Ishlab chiqish uchun boshlangʻich maʼlumot: bitta namuna klinika va unga
// nusxalangan beshta rol shabloni.
//
// Rol shablonlari bazada emas, kodda turadi (packages/shared/rollar.ts):
// ular har klinikaga nusxalanadi va oʻsha klinikaniki boʻlib qoladi, shuning
// uchun «umumiy shablon qatori» degan tushuncha kerak emas.

import { addDays, ROLE_TEMPLATE_SPECS, ROLE_TEMPLATES } from '@e-dentist/shared'
import { generateQueueCode } from '../src/modules/clinics/queueCode.js'
import { createDb } from '../src/platform/db.js'

const DEMO_CLINIC_ID = '00000000-0000-7000-8000-000000000001'
const TRIAL_DAYS = 14

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed faqat ishlab chiqish muhitida ishlaydi — u namuna maʼlumot yozadi')
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL berilmagan')

  const db = createDb(url)

  const clinic = await db.clinic.upsert({
    where: { id: DEMO_CLINIC_ID },
    create: {
      id: DEMO_CLINIC_ID,
      name: 'Namuna stomatologiya',
      phone: '+998901234567',
      isTrial: true,
      queueCode: generateQueueCode(),
      expiresAt: addDays(TRIAL_DAYS),
    },
    update: {},
  })

  for (const template of ROLE_TEMPLATES) {
    const spec = ROLE_TEMPLATE_SPECS[template]
    await db.role.upsert({
      where: { clinicId_template: { clinicId: clinic.id, template: template } },
      create: {
        clinicId: clinic.id,
        template: template,
        name: spec.label,
        permissions: [...spec.permissions],
        isOwner: spec.isOwner,
      },
      // Shablon kodda oʻzgarsa, mavjud klinikada ham yangilansin
      update: {
        name: spec.label,
        permissions: [...spec.permissions],
        isOwner: spec.isOwner,
      },
    })
  }

  const roles = await db.role.findMany({
    where: { clinicId: clinic.id },
    orderBy: { template: 'asc' },
  })

  console.log(`Klinika: ${clinic.name}`)
  console.log(`Sinov tugaydi: ${clinic.expiresAt.toISOString().slice(0, 10)}`)
  console.log(`Rollar (${roles.length}):`)
  for (const r of roles) {
    console.log(`  ${r.name.padEnd(12)} ${r.permissions.length} ruxsat`)
  }

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
