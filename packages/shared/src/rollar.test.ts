import { describe, expect, it } from 'vitest'
import { EGASI_MAJBURIY_RUXSATLAR, ROL_SHABLONI_TAVSIFI } from './rollar.js'
import { ROL_SHABLONLARI, RUXSATLAR } from './types.js'

const shablonlar = ROL_SHABLONLARI.map((s) => ROL_SHABLONI_TAVSIFI[s])

describe('rol shablonlari', () => {
  it('beshtasi ham mavjud', () => {
    expect(shablonlar).toHaveLength(5)
  })

  it('faqat mavjud ruxsatlarni ishlatadi — nomi notoʻgʻri yozilgani oʻtmaydi', () => {
    for (const t of shablonlar) {
      for (const r of t.ruxsatlar) expect(RUXSATLAR).toContain(r)
    }
  })

  it('takrorlangan ruxsat yoʻq', () => {
    for (const t of shablonlar) {
      expect(new Set(t.ruxsatlar).size).toBe(t.ruxsatlar.length)
    }
  })
})

describe('egasi', () => {
  it('barcha ruxsatlarga ega', () => {
    expect([...ROL_SHABLONI_TAVSIFI.egasi.ruxsatlar]).toEqual([...RUXSATLAR])
  })

  it('yagona isOwner rol', () => {
    expect(shablonlar.filter((t) => t.isOwner)).toHaveLength(1)
    expect(ROL_SHABLONI_TAVSIFI.egasi.isOwner).toBe(true)
  })

  it('majburiy ruxsatlarni oʻz ichiga oladi — klinika qulflanib qolmaydi', () => {
    for (const r of EGASI_MAJBURIY_RUXSATLAR) {
      expect(ROL_SHABLONI_TAVSIFI.egasi.ruxsatlar).toContain(r)
    }
  })
})

describe('boshqa rollar chegarasi', () => {
  it('xodim va obuna boshqaruvi faqat egasida', () => {
    for (const t of shablonlar.filter((x) => !x.isOwner)) {
      expect(t.ruxsatlar).not.toContain('staff.manage')
      expect(t.ruxsatlar).not.toContain('billing.manage')
    }
  })

  it('texnik faqat oʻz naryadlarini koʻradi — kartotekaga kirmaydi', () => {
    expect([...ROL_SHABLONI_TAVSIFI.texnik.ruxsatlar]).toEqual(['lab.own'])
  })

  it('kuzatuvchi hech narsa oʻzgartirmaydi', () => {
    for (const r of ROL_SHABLONI_TAVSIFI.kuzatuvchi.ruxsatlar) {
      expect(r.endsWith('.read')).toBe(true)
    }
  })

  it('texnik narxlari va eksport faqat egasida', () => {
    for (const t of shablonlar.filter((x) => !x.isOwner)) {
      expect(t.ruxsatlar).not.toContain('lab.cost')
      expect(t.ruxsatlar).not.toContain('data.export')
    }
  })
})
