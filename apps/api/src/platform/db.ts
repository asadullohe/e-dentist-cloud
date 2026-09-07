// Prisma klienti. Prisma 7 dan boshlab ulanish adapter orqali beriladi.
//
// Bu — xom klient. Modullar unga toʻgʻridan-toʻgʻri murojaat qilmaydi:
// 1.7 da ustiga repozitoriya qatlami quriladi, u har soʻrovga clinicId ni
// avtomatik qoʻshadi. Qoʻlda yozilgan soʻrov — unutib qoʻyish xavfi.

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

export type Db = PrismaClient

export function createDb(databaseUrl: string): Db {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })
}
