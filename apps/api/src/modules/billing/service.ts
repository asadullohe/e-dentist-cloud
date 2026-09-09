// Obuna. Oʻz jadvali yoʻq: muddat va holat `clinics` qatorida, u esa
// `clinics` moduliniki (tz.md 8-boʻlim).
//
// Qoida bitta va qatʼiy: muddat tugasa — faqat oʻqish. Maʼlumot koʻrinadi,
// eksport qilinadi, lekin yangi yozuv qoʻshilmaydi. Maʼlumot hech qachon
// oʻchirilmaydi (tz.md 8-boʻlim).

import { BILLING_TEXT, todayISO } from '@e-dentist/shared'
import type { Db } from '../../platform/db.js'
import { errors } from '../../platform/errors.js'
import { withClinic } from '../../platform/tenant.js'
import * as clinics from '../clinics/service.js'

export interface BillingDeps {
  db: Db
}

export interface Subscription {
  expiresAt: string
  isTrial: boolean
  blocked: boolean
  /// Muddat tugagan yoki bloklangan — yozish yopiq
  readOnly: boolean
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/// Muddat oxirgi kunning oʻzida ham ochiq: `expires_at` — «shu kungacha»
export function subscriptionOf(clinic: {
  expiresAt: Date
  isTrial: boolean
  status: string
}): Subscription {
  const expiresAt = toIso(clinic.expiresAt)
  const blocked = clinic.status !== 'active'
  return {
    expiresAt,
    isTrial: clinic.isTrial,
    blocked,
    readOnly: blocked || expiresAt < todayISO(),
  }
}

/// Yozuvdan oldin chaqiriladi. Har soʻrovda bazadan oʻqiladi: muddat
/// boshqaruv panelidan uzaytirilishi mumkin va bu darhol kuchga kirishi
/// kerak — xodim qayta kirguncha emas
export async function assertWritable(deps: BillingDeps, clinicId: string): Promise<void> {
  const clinic = await withClinic(deps.db, clinicId, (tx) => clinics.findClinic(tx, clinicId))
  if (!clinic) throw errors.unauthorized()

  const subscription = subscriptionOf(clinic)
  if (!subscription.readOnly) return

  throw errors.forbidden(subscription.blocked ? BILLING_TEXT.blocked : BILLING_TEXT.expired)
}
