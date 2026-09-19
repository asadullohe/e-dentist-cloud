// Ochiq sahifalar (navbat, fikr) uchun qurilma belgisi.
//
// Login emas — faqat «shu brauzerdan bugun nechta yozuv boʻldi» degan
// hisob uchun. Cookie tozalansa aylanib oʻtiladi, shuning uchun bu
// yagona toʻsiq emas: IP cheklovi bilan birga ishlaydi (tz.md 14-boʻlim)

import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

const DEVICE_COOKIE = 'ed_device'
const DEVICE_TTL = 60 * 60 * 24 * 365

/// Qurilma belgisi: boʻlmasa yaratiladi va cookie ga yoziladi.
/// `secure` — prod da cookie faqat HTTPS orqali yuboriladi
export function deviceId(req: FastifyRequest, reply: FastifyReply, secure: boolean): string {
  const existing = req.cookies[DEVICE_COOKIE]
  if (existing) return existing

  const fresh = randomUUID()
  reply.setCookie(DEVICE_COOKIE, fresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: DEVICE_TTL,
  })
  return fresh
}
