// Sessiya cookie sini oʻqiydi va soʻrovga bogʻlaydi.
// Ruxsat tekshiruvi (requirePermission) — bosqich 1.13.

import type { Permission } from '@e-dentist/shared'
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { errors } from './errors.js'
import { SESSION_COOKIE, type SessionData, type SessionStore } from './session.js'

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionData | null
    sessionId: string | null
    permissions: readonly Permission[]
    /// Kimning koʻzi bilan koʻradi (tz.md 20-boʻlim): shifokor — oʻzi,
    /// assistent — biriktirilgan shifokorlari. Ruxsatlar bilan birga yuklanadi
    scopeDoctorIds: readonly string[] | null
  }

  interface FastifyInstance {
    /// `preHandler: app.requirePermission('patients.read')`
    requirePermission(required: Permission): preHandlerHookHandler
    /// Sanab oʻtilganlardan bittasi yetarli. Naryadlarda kerak: texnik
    /// `lab.own` bilan, shifokor `lab.write` bilan bir marshrutga kiradi
    requireAnyPermission(...required: Permission[]): preHandlerHookHandler
  }
}

export function sessionHook(sessions: SessionStore) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    req.session = null
    req.sessionId = null
    req.scopeDoctorIds = null

    const id = req.cookies[SESSION_COOKIE]
    if (!id) return

    const data = await sessions.read(id)
    if (!data) return

    req.sessionId = id
    req.session = data
  }
}

/// Kirmagan boʻlsa 401
export function requireAuth(req: FastifyRequest): SessionData {
  if (!req.session) throw errors.unauthorized()
  return req.session
}

/// «Kim koʻrayapti» — oʻzinikini yoki hammasini. Bitta shakl ikki joyda:
/// bemorlar (`patients.all`) va qabul jadvali (`schedule.all`). `all`
/// boʻlmasa modul roʻyxatni `userId` ga qarab toraytiradi
export interface ScopedViewer {
  /// Muallif: kim yozdi, kim yukladi, audit — doim odamning oʻzi
  userId: string
  all: boolean
  /// Kimning bemorlari va qabullari (tz.md 20-boʻlim). Shifokorda — oʻzi;
  /// assistentda — biriktirilgan shifokorlari. `all` da ishlatilmaydi
  doctorIds: readonly string[]
}

/// Marshrutda: guard ruxsatlarni yuklab boʻlgan, shu yerda faqat oʻqiladi
export function viewerOf(req: FastifyRequest, wide: Permission): ScopedViewer {
  const session = requireAuth(req)
  return {
    userId: session.userId,
    all: req.permissions.includes(wide),
    doctorIds: scopeOf(req, session.userId),
  }
}

/// Guard oʻtmagan marshrutda (yuklanmagan) — odamning oʻzi
export function scopeOf(req: FastifyRequest, userId: string): readonly string[] {
  return req.scopeDoctorIds ?? [userId]
}

/// Cheklangan koʻruvchi shu shifokorning yozuvini koʻradimi
export function seesDoctor(
  viewer: { all: boolean; doctorIds: readonly string[] },
  doctorId: string | null,
): boolean {
  return viewer.all || (doctorId !== null && viewer.doctorIds.includes(doctorId))
}

/// Roʻyxat filtri. Cheklangan koʻruvchi doirasidan tashqarini tanlay olmaydi:
/// tanlagani doirada boʻlsa — faqat u, aks holda butun doirasi
export function doctorFilter(
  viewer: { all: boolean; doctorIds: readonly string[] },
  requested: string | undefined,
): string[] | undefined {
  if (viewer.all) return requested ? [requested] : undefined
  return requested && viewer.doctorIds.includes(requested) ? [requested] : [...viewer.doctorIds]
}

/// Yangi yozuvning shifokori. Cheklangan koʻruvchi faqat oʻz doirasidagi
/// shifokorni tanlay oladi — boshqasi soʻralsa doiradagi birinchisi (shifokorda
/// — oʻzi). Aks holda yozuv uning koʻzidan gʻoyib boʻlardi
export function pickDoctor(
  viewer: { all: boolean; doctorIds: readonly string[]; userId: string },
  requested: string | null | undefined,
): string {
  if (viewer.all) return requested ?? viewer.userId
  if (requested && viewer.doctorIds.includes(requested)) return requested
  return viewer.doctorIds[0] ?? viewer.userId
}

/// Platforma admini — hech qaysi klinikaga tegishli emas (`clinic_id`
/// boʻsh). Klinika marshrutlari unga baribir yopiq: ular ruxsat talab
/// qiladi, ruxsatlar esa roldan keladi, rol esa klinikaniki
export function requirePlatformAdmin(req: FastifyRequest): SessionData {
  const session = requireAuth(req)
  if (session.clinicId) throw errors.forbidden()
  return session
}

/// Rolning ruxsatlarini oʻqiydi. clinics moduli beradi — platform modullarni
/// import qilmaydi, shuning uchun funksiya tashqaridan uzatiladi
export interface UserAccess {
  permissions: readonly Permission[]
  /// `ScopedViewer.doctorIds` manbai
  doctorIds: readonly string[]
}

export type PermissionLoader = (clinicId: string, userId: string) => Promise<UserAccess>

/// Rol ham, ruxsatlar ham har soʻrovda bazadan oʻqiladi.
///
/// Sabab: egasi xodimning rolini almashtirishi yoki rolning ruxsatlarini
/// oʻzgartirishi mumkin, xodimni butunlay faolsizlantirishi ham. Bularning
/// hammasi darhol kuchga kirishi kerak — xodim qayta kirguncha emas
export function permissionGuard(load: PermissionLoader) {
  return (required: Permission): preHandlerHookHandler => {
    return async (req: FastifyRequest) => {
      const permissions = await loadInto(load, req)
      if (!permissions.includes(required)) throw errors.forbidden()
    }
  }
}

/// Bittasi yetarli. Marshrut ichida `req.permissions` orqali qaysi biri
/// borligini aniqlash mumkin — masalan texnik faqat oʻz naryadlarini koʻradi
export function anyPermissionGuard(load: PermissionLoader) {
  return (...required: Permission[]): preHandlerHookHandler => {
    return async (req: FastifyRequest) => {
      const permissions = await loadInto(load, req)
      if (!required.some((item) => permissions.includes(item))) throw errors.forbidden()
    }
  }
}

async function loadInto(
  load: PermissionLoader,
  req: FastifyRequest,
): Promise<readonly Permission[]> {
  const session = requireAuth(req)
  if (!session.clinicId) throw errors.forbidden()

  const access = await load(session.clinicId, session.userId)
  req.permissions = access.permissions
  req.scopeDoctorIds = access.doctorIds
  return access.permissions
}
