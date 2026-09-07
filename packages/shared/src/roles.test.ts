import { describe, expect, it } from 'vitest'
import { OWNER_REQUIRED_PERMISSIONS, ROLE_TEMPLATE_SPECS } from './roles.js'
import { PERMISSIONS, ROLE_TEMPLATES } from './types.js'

const specs = ROLE_TEMPLATES.map((s) => ROLE_TEMPLATE_SPECS[s])

describe('rol shablonlari', () => {
  it('beshtasi ham mavjud', () => {
    expect(specs).toHaveLength(5)
  })

  it('faqat mavjud ruxsatlarni ishlatadi — nomi notoʻgʻri yozilgani oʻtmaydi', () => {
    for (const t of specs) {
      for (const r of t.permissions) expect(PERMISSIONS).toContain(r)
    }
  })

  it('takrorlangan ruxsat yoʻq', () => {
    for (const t of specs) {
      expect(new Set(t.permissions).size).toBe(t.permissions.length)
    }
  })
})

describe('egasi', () => {
  it('barcha ruxsatlarga ega', () => {
    expect([...ROLE_TEMPLATE_SPECS.egasi.permissions]).toEqual([...PERMISSIONS])
  })

  it('yagona isOwner rol', () => {
    expect(specs.filter((t) => t.isOwner)).toHaveLength(1)
    expect(ROLE_TEMPLATE_SPECS.egasi.isOwner).toBe(true)
  })

  it('majburiy ruxsatlarni oʻz ichiga oladi — klinika qulflanib qolmaydi', () => {
    for (const r of OWNER_REQUIRED_PERMISSIONS) {
      expect(ROLE_TEMPLATE_SPECS.egasi.permissions).toContain(r)
    }
  })
})

describe('boshqa rollar chegarasi', () => {
  it('xodim va obuna boshqaruvi faqat egasida', () => {
    for (const t of specs.filter((x) => !x.isOwner)) {
      expect(t.permissions).not.toContain('staff.manage')
      expect(t.permissions).not.toContain('billing.manage')
    }
  })

  it('texnik faqat oʻz naryadlarini koʻradi — kartotekaga kirmaydi', () => {
    expect([...ROLE_TEMPLATE_SPECS.texnik.permissions]).toEqual(['lab.own'])
  })

  it('kuzatuvchi hech narsa oʻzgartirmaydi', () => {
    for (const r of ROLE_TEMPLATE_SPECS.kuzatuvchi.permissions) {
      expect(r.endsWith('.read')).toBe(true)
    }
  })

  it('texnik narxlari va eksport faqat egasida', () => {
    for (const t of specs.filter((x) => !x.isOwner)) {
      expect(t.permissions).not.toContain('lab.cost')
      expect(t.permissions).not.toContain('data.export')
    }
  })
})
