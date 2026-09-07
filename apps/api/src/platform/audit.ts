// Audit yozuvi. Tibbiy maʼlumot bilan ishlaydigan tizimda kim nima qilgani
// yozilishi shart (tz.md 12-boʻlim).
//
// Jadval platform da: u bitta modulga tegishli emas, hamma modul yozadi.

import type { Prisma } from '../../generated/prisma/client.js'
import { ijarachisiz, type KlinikaTx } from './tenant.js'

export const AMAL = {
  royxatdan_otdi: 'royxatdan_otdi',
  pochta_tasdiqlandi: 'pochta_tasdiqlandi',
  kirdi: 'kirdi',
  kirish_xatosi: 'kirish_xatosi',
  chiqdi: 'chiqdi',
  rol_ozgardi: 'rol_ozgardi',
  xodim_ozgardi: 'xodim_ozgardi',
} as const

export type Amal = (typeof AMAL)[keyof typeof AMAL]

export interface AuditYozuvi {
  userId?: string | null
  action: Amal
  entity: string
  entityId?: string | null
  /// IP, nechta qator yuklandi va h.k. Bemor maʼlumoti bu yerga yozilmaydi
  meta?: Record<string, unknown>
}

export async function yozAudit(tx: KlinikaTx, y: AuditYozuvi): Promise<void> {
  await tx.auditLog.create({
    data: ijarachisiz({
      userId: y.userId ?? null,
      action: y.action,
      entity: y.entity,
      entityId: y.entityId ?? null,
      // Prisma Json ustunini oʻz tipi bilan kutadi; bizniki oddiy obyekt
      meta: (y.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    }),
  })
}
