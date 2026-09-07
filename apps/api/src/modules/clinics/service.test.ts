import { EGASI_MAJBURIY_RUXSATLAR, RUXSATLAR } from '@e-dentist/shared'
import { describe, expect, it } from 'vitest'
import { tekshirRolRuxsatlari } from './service.js'

describe('tekshirRolRuxsatlari', () => {
  it('notoʻgʻri yozilgan ruxsatni rad etadi', () => {
    expect(() => tekshirRolRuxsatlari(false, ['patients.reed'])).toThrow(/Notoʻgʻri ruxsat/)
  })

  it('oddiy rolga istalgan toʻplam mumkin', () => {
    expect(() => tekshirRolRuxsatlari(false, [])).not.toThrow()
    expect(() => tekshirRolRuxsatlari(false, ['patients.read'])).not.toThrow()
  })

  // Egasi bu ikkitasini yoʻqotsa klinika oʻz kabinetidan qulflanib qoladi:
  // na yangi xodim qoʻsha oladi, na obunani uzaytira oladi
  it('egasi xodim boshqaruvini yoʻqota olmaydi', () => {
    const staffsiz = RUXSATLAR.filter((p) => p !== 'staff.manage')
    expect(() => tekshirRolRuxsatlari(true, staffsiz)).toThrow(/yoʻqota olmaydi/)
  })

  it('egasi obuna boshqaruvini yoʻqota olmaydi', () => {
    const billingsiz = RUXSATLAR.filter((p) => p !== 'billing.manage')
    expect(() => tekshirRolRuxsatlari(true, billingsiz)).toThrow(/yoʻqota olmaydi/)
  })

  it('egasi majburiylar saqlansa boshqasini yoʻqota oladi', () => {
    expect(() => tekshirRolRuxsatlari(true, [...EGASI_MAJBURIY_RUXSATLAR])).not.toThrow()
  })
})
