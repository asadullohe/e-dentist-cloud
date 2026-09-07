// UUID v7 — vaqt boʻyicha tartiblangan identifikator.
//
// Nega kerak: klinika qatorini yaratishdan OLDIN uning id si maʼlum boʻlishi
// shart. RLS siyosati `WITH CHECK (id = app_clinic_id())` deb turadi, yaʼni
// sessiya kontekstiga oʻsha id ni qoʻyish kerak — bazaning oʻzi yaratguncha
// kutib boʻlmaydi.
//
// Node ning crypto.randomUUID() faqat v4 beradi. v7 esa boshida vaqt belgisi
// bilan keladi: indeksga ketma-ket yoziladi, tasodifiy v4 kabi sochilmaydi.

import { randomBytes } from 'node:crypto'

export function uuidV7(): string {
  const b = randomBytes(16)
  // Birinchi 48 bit — millisekundlardagi vaqt (2^48 ms ≈ 8900-yilgacha yetadi)
  b.writeUIntBE(Date.now(), 0, 6)
  // Versiya = 7 (yuqori tetrada), variant = 10xx (RFC 9562)
  b.writeUInt8((b.readUInt8(6) & 0x0f) | 0x70, 6)
  b.writeUInt8((b.readUInt8(8) & 0x3f) | 0x80, 8)
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
