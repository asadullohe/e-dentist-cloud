// Rol shablonlari. Klinika roʻyxatdan oʻtganda beshtasi ham oʻsha klinikaga
// nusxalanadi va uniki boʻlib qoladi: egasi istalganini tahrirlashi mumkin,
// bu boshqa klinikalarga taʼsir qilmaydi (tz.md 6-boʻlim).

import { ROLE_LABELS } from './strings.js'
import { PERMISSIONS, type Permission, type RoleTemplate } from './types.js'

export interface RoleTemplateSpec {
  template: RoleTemplate
  label: string
  isOwner: boolean
  permissions: readonly Permission[]
}

// Egasi bu ikkitasini hech qachon yoʻqota olmaydi — interfeys ham, server ham
// rad etadi. Busiz klinika oʻz kabinetidan qulflanib qolishi mumkin
export const OWNER_REQUIRED_PERMISSIONS: readonly Permission[] = ['staff.manage', 'billing.manage']

export const ROLE_TEMPLATE_SPECS: Record<RoleTemplate, RoleTemplateSpec> = {
  egasi: {
    template: 'egasi',
    label: ROLE_LABELS.owner,
    isOwner: true,
    permissions: PERMISSIONS,
  },

  // «Bemorlar, tashriflar, tish xaritasi, qabullar» + naryad yozish
  shifokor: {
    template: 'shifokor',
    label: ROLE_LABELS.shifokor,
    isOwner: false,
    permissions: [
      'patients.read',
      'patients.write',
      'visits.write',
      'teeth.write',
      'schedule.write',
      'lab.write',
    ],
  },

  // «Bemorlar, qabullar, toʻlovlar» + navbatni boshqarish
  qabulxona: {
    template: 'qabulxona',
    label: ROLE_LABELS.qabulxona,
    isOwner: false,
    permissions: [
      'patients.read',
      'patients.write',
      'schedule.write',
      'payments.read',
      'payments.write',
      'queue.manage',
    ],
  },

  // Faqat oʻziga biriktirilgan naryadlar. patients.read ataylab berilmagan:
  // u butun kartotekani ochib yuboradi. Texnikka kerak boʻlgan yagona narsa —
  // bemorning ismi — naryadning oʻzida keladi (tz.md 7-boʻlim)
  texnik: {
    template: 'texnik',
    label: ROLE_LABELS.techRole,
    isOwner: false,
    permissions: ['lab.own'],
  },

  // Buxgalter, stajyor. Faqat oʻqiydi
  kuzatuvchi: {
    template: 'kuzatuvchi',
    label: ROLE_LABELS.kuzatuvchi,
    isOwner: false,
    permissions: ['patients.read', 'payments.read', 'expenses.read', 'reports.read'],
  },
}
