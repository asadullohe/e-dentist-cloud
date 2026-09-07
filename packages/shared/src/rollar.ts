// Rol shablonlari. Klinika roʻyxatdan oʻtganda beshtasi ham oʻsha klinikaga
// nusxalanadi va uniki boʻlib qoladi: egasi istalganini tahrirlashi mumkin,
// bu boshqa klinikalarga taʼsir qilmaydi (tz.md 6-boʻlim).

import { ROL_NOMI } from './strings.js'
import { type RolShabloni, RUXSATLAR, type Ruxsat } from './types.js'

export interface RolShabloniTavsifi {
  shablon: RolShabloni
  nom: string
  isOwner: boolean
  ruxsatlar: readonly Ruxsat[]
}

// Egasi bu ikkitasini hech qachon yoʻqota olmaydi — interfeys ham, server ham
// rad etadi. Busiz klinika oʻz kabinetidan qulflanib qolishi mumkin
export const EGASI_MAJBURIY_RUXSATLAR: readonly Ruxsat[] = ['staff.manage', 'billing.manage']

export const ROL_SHABLONI_TAVSIFI: Record<RolShabloni, RolShabloniTavsifi> = {
  egasi: {
    shablon: 'egasi',
    nom: ROL_NOMI.egasi,
    isOwner: true,
    ruxsatlar: RUXSATLAR,
  },

  // «Bemorlar, tashriflar, tish xaritasi, qabullar» + naryad yozish
  shifokor: {
    shablon: 'shifokor',
    nom: ROL_NOMI.shifokor,
    isOwner: false,
    ruxsatlar: [
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
    shablon: 'qabulxona',
    nom: ROL_NOMI.qabulxona,
    isOwner: false,
    ruxsatlar: [
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
    shablon: 'texnik',
    nom: ROL_NOMI.texnik,
    isOwner: false,
    ruxsatlar: ['lab.own'],
  },

  // Buxgalter, stajyor. Faqat oʻqiydi
  kuzatuvchi: {
    shablon: 'kuzatuvchi',
    nom: ROL_NOMI.kuzatuvchi,
    isOwner: false,
    ruxsatlar: ['patients.read', 'payments.read', 'expenses.read', 'reports.read'],
  },
}
