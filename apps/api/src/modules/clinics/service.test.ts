import { OWNER_REQUIRED_PERMISSIONS, PERMISSIONS } from '@e-dentist/shared'
import { describe, expect, it } from 'vitest'
import { assertRolePermissions } from './service.js'

describe('assertRolePermissions', () => {
  it('notoʻgʻri yozilgan ruxsatni rad etadi', () => {
    expect(() => assertRolePermissions(false, ['patients.reed'])).toThrow(/Notoʻgʻri ruxsat/)
  })

  it('oddiy rolga istalgan toʻplam mumkin', () => {
    expect(() => assertRolePermissions(false, [])).not.toThrow()
    expect(() => assertRolePermissions(false, ['patients.read'])).not.toThrow()
  })

  // Egasi bu ikkitasini yoʻqotsa klinika oʻz kabinetidan qulflanib qoladi:
  // na yangi xodim qoʻsha oladi, na obunani uzaytira oladi
  it('egasi xodim boshqaruvini yoʻqota olmaydi', () => {
    const withoutStaff = PERMISSIONS.filter((p) => p !== 'staff.manage')
    expect(() => assertRolePermissions(true, withoutStaff)).toThrow(/yoʻqota olmaydi/)
  })

  it('egasi obuna boshqaruvini yoʻqota olmaydi', () => {
    const withoutBilling = PERMISSIONS.filter((p) => p !== 'billing.manage')
    expect(() => assertRolePermissions(true, withoutBilling)).toThrow(/yoʻqota olmaydi/)
  })

  it('egasi majburiylar saqlansa boshqasini yoʻqota oladi', () => {
    expect(() => assertRolePermissions(true, [...OWNER_REQUIRED_PERMISSIONS])).not.toThrow()
  })
})
