// Platforma adminini yaratadi yoki parolini almashtiradi.
//
//   npm run admin:create -w @e-dentist/api -- pochta@example.com parol "Ism Familiya"
//
// Admin hech qaysi klinikaga tegishli emas: `clinic_id` va `role_id` boʻsh.
// Shu sababli unga klinika marshrutlari umuman ochilmaydi — ular ruxsat
// talab qiladi, ruxsat esa roldan keladi.

import { createDb } from '../platform/db.js'
import { hashPassword } from '../platform/password.js'
import { uuidV7 } from '../platform/uuid.js'

const [email, password, fullName] = process.argv.slice(2)

if (!email || !password) {
  console.error('Foydalanish: create-admin.ts <pochta> <parol> [ism]')
  process.exit(1)
}
if (password.length < 12) {
  // Admin hisobi butun platformani ochadi — qisqa parol bu yerda mumkin emas
  console.error('Parol kamida 12 belgi boʻlsin')
  process.exit(1)
}

const db = createDb(process.env.DATABASE_URL as string)
const passwordHash = await hashPassword(password)
const normalized = email.trim().toLowerCase()

const existing = await db.user.findUnique({ where: { email: normalized } })

if (existing) {
  if (existing.clinicId) {
    console.error('Bu pochta klinika xodimiga tegishli — admin qila olmaymiz')
    process.exit(1)
  }
  await db.user.update({
    where: { id: existing.id },
    data: { passwordHash, status: 'active', emailVerifiedAt: new Date() },
  })
  console.log('Admin paroli yangilandi:', normalized)
} else {
  await db.user.create({
    data: {
      id: uuidV7(),
      email: normalized,
      passwordHash,
      fullName: fullName ?? null,
      // Pochta tasdiqlash oqimi klinikalar uchun — admin qoʻlda yaratiladi
      emailVerifiedAt: new Date(),
    },
  })
  console.log('Admin yaratildi:', normalized)
}

await db.$disconnect()
