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

// `label` — getter: import vaqtida emas, oʻqilganda joriy tilda qaytadi
export const ROLE_TEMPLATE_SPECS: Record<RoleTemplate, RoleTemplateSpec> = {
  egasi: {
    template: 'egasi',
    get label() {
      return ROLE_LABELS.owner
    },
    isOwner: true,
    permissions: PERMISSIONS,
  },

  // «Bemorlar, tashriflar, tish xaritasi, qabullar» + naryad yozish +
  // oʻz ish haqi hisobi (tz.md 15-boʻlim)
  shifokor: {
    template: 'shifokor',
    get label() {
      return ROLE_LABELS.shifokor
    },
    isOwner: false,
    permissions: [
      'patients.read',
      'patients.write',
      'visits.write',
      'teeth.write',
      'schedule.write',
      // Toʻlov qabul qilish (qaror 19/09/2026): kichik klinikada pulni
      // shifokorning oʻzi oladi
      'payments.read',
      'payments.write',
      'lab.write',
      'payroll.own',
      // Davolash rejasi (18-boʻlim): rejani shifokor tuzadi va bemorga
      // koʻrsatadi — bu uning ishi, qabulxonaniki emas
      'plans.read',
      'plans.write',
    ],
  },

  // «Bemorlar, qabullar, toʻlovlar» + navbatni boshqarish. Jadvalda hamma
  // shifokorni koʻradi (`schedule.all`) — shifokor esa faqat oʻzinikini
  qabulxona: {
    template: 'qabulxona',
    get label() {
      return ROLE_LABELS.qabulxona
    },
    isOwner: false,
    permissions: [
      'patients.read',
      'patients.write',
      // Hamma bemor: qabulxona pulni oladi, navbatni yuritadi — kimniki
      // ekanidan qatʼi nazar. Shifokor esa faqat oʻz bemorlarini koʻradi
      'patients.all',
      'schedule.write',
      'schedule.all',
      'payments.read',
      'payments.write',
      'queue.manage',
      // Rejani koʻradi — bemor «qancha boʻladi?» deb soʻraganda javob
      // beradi. Tuzish shifokorniki
      'plans.read',
    ],
  },

  // Faqat oʻziga biriktirilgan naryadlar. patients.read ataylab berilmagan:
  // u butun kartotekani ochib yuboradi. Texnikka kerak boʻlgan yagona narsa —
  // bemorning ismi — naryadning oʻzida keladi (tz.md 7-boʻlim)
  texnik: {
    template: 'texnik',
    get label() {
      return ROLE_LABELS.techRole
    },
    isOwner: false,
    permissions: ['lab.own'],
  },

  // Buxgalter, stajyor. Faqat oʻqiydi
  kuzatuvchi: {
    template: 'kuzatuvchi',
    get label() {
      return ROLE_LABELS.kuzatuvchi
    },
    isOwner: false,
    permissions: [
      'patients.read',
      'patients.all',
      'payments.read',
      'expenses.read',
      'reports.read',
      'plans.read',
    ],
  },
}

/// Rol nomi ekranda. Bazadagi `name` roʻyxatdan oʻtish paytidagi tilda
/// qotib qolgan — shablon nomi joriy tilda koʻrsatiladi. Nomaʼlum shablon
/// (kelajakdagi maxsus rol) — bazadagi nom
export function roleLabel(role: { name: string; template: string }): string {
  return (
    (ROLE_TEMPLATE_SPECS as Partial<Record<string, RoleTemplateSpec>>)[role.template]?.label ??
    role.name
  )
}
