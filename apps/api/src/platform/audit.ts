// Audit yozuvi. Tibbiy maʼlumot bilan ishlaydigan tizimda kim nima qilgani
// yozilishi shart (tz.md 12-boʻlim).
//
// Jadval platform da: u bitta modulga tegishli emas, hamma modul yozadi.

import type { Prisma } from '../../generated/prisma/client.js'
import { type ClinicTx, tenantScoped } from './tenant.js'

export const AUDIT_ACTION = {
  registered: 'registered',
  email_verified: 'email_verified',
  loggedIn: 'logged_in',
  login_failed: 'login_failed',
  logged_out: 'logged_out',
  role_changed: 'role_changed',
  staff_changed: 'staff_changed',
} as const

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION]

export interface AuditEntry {
  userId?: string | null
  action: AuditAction
  entity: string
  entityId?: string | null
  /// IP, nechta qator yuklandi va h.k. Bemor maʼlumoti bu yerga yozilmaydi
  meta?: Record<string, unknown>
}

export async function writeAudit(tx: ClinicTx, y: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: tenantScoped({
      userId: y.userId ?? null,
      action: y.action,
      entity: y.entity,
      entityId: y.entityId ?? null,
      // Prisma Json ustunini oʻz tipi bilan kutadi; bizniki oddiy obyekt
      meta: (y.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    }),
  })
}
