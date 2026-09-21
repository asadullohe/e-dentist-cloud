import {
  EXPORT_UI,
  FEEDBACK_CABINET_UI,
  LOGO_UI,
  type Permission,
  QUEUE_CABINET_UI,
  STAFF_UI,
} from '@e-dentist/shared'
import {
  BellIcon,
  BuildingIcon,
  DatabaseIcon,
  type LucideIcon,
  MessageSquareIcon,
  ShieldIcon,
  UserCogIcon,
  UsersIcon,
} from 'lucide-react'

export interface SettingsItem {
  to: string
  label: string
  icon: LucideIcon
  /// Boʻlim faqat shu ruxsat bilan koʻrinadi; roʻyxat — istalgan biri
  permission?: Permission | readonly Permission[]
}

/// Sozlamalar boʻlimlari. Ikki joyda ishlatiladi: sahifaning chap
/// navigatsiyasida va asosiy yon menyuda (ochiladigan guruh sifatida).
///
/// Funksiya, konstanta emas: matnlar joriy tilga qarab oʻqilishi kerak.
/// Modul darajasidagi massiv ularni import vaqtida muzlatib qoʻyardi
export const settingsItems = (): readonly SettingsItem[] => [
  // «Hisobim» — har xodimga: egasi bergan boshlangʻich parolni shu yerda
  // almashtiradi (tz.md 6-boʻlim). Qolganlari egasining ishi
  { to: '/settings', label: STAFF_UI.account_tab, icon: UserCogIcon },
  {
    to: '/settings/xodimlar',
    label: STAFF_UI.staff_tab,
    icon: UsersIcon,
    permission: 'staff.manage',
  },
  {
    to: '/settings/rollar',
    label: STAFF_UI.roles_tab,
    icon: ShieldIcon,
    permission: 'staff.manage',
  },
  { to: '/settings/klinika', label: LOGO_UI.tab, icon: BuildingIcon, permission: 'staff.manage' },
  {
    to: '/settings/navbat',
    label: QUEUE_CABINET_UI.settings_tab,
    icon: BellIcon,
    permission: 'staff.manage',
  },
  // Egasi hammasini, shifokor (`feedback.own` berilsa) oʻzi haqidagini koʻradi
  {
    to: '/settings/fikrlar',
    label: FEEDBACK_CABINET_UI.tab,
    icon: MessageSquareIcon,
    permission: ['feedback.read', 'feedback.own'],
  },
  { to: '/settings/malumot', label: EXPORT_UI.tab, icon: DatabaseIcon, permission: 'data.export' },
]
