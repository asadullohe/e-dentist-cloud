// Fastify serveri bosqich 1.3 da quriladi. Hozircha shared paket
// ulanishini tekshirish uchun.
import { soum, todayStr } from '@e-dentist/shared'

console.log(`e-dentist api · ${todayStr()} · namuna summa: ${soum(1234567)}`)
