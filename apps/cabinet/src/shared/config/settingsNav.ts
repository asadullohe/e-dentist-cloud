import { EXPORT_UI, LOGO_UI, type Permission, QUEUE_CABINET_UI, STAFF_UI } from '@e-dentist/shared'
import {
  BellIcon,
  BuildingIcon,
  DatabaseIcon,
  type LucideIcon,
  ShieldIcon,
  UserCogIcon,
  UsersIcon,
} from 'lucide-react'

export interface SettingsItem {
  to: string
  label: string
  icon: LucideIcon
  /// Boʻlim faqat shu ruxsat bilan koʻrinadi
  permission?: Permission
}

/// Sozlamalar boʻlimlari. Ikki joyda ishlatiladi: sahifaning chap
/// navigatsiyasida va asosiy yon menyuda (ochiladigan guruh sifatida).
///
/// Funksiya, konstanta emas: matnlar joriy tilga qarab oʻqilishi kerak.
/// Modul darajasidagi massiv ularni import vaqtida muzlatib qoʻyardi
export const settingsItems = (): readonly SettingsItem[] => [
  { to: '/settings', label: STAFF_UI.account_tab, icon: UserCogIcon },
  { to: '/settings/xodimlar', label: STAFF_UI.staff_tab, icon: UsersIcon },
  { to: '/settings/rollar', label: STAFF_UI.roles_tab, icon: ShieldIcon },
  { to: '/settings/klinika', label: LOGO_UI.tab, icon: BuildingIcon },
  { to: '/settings/navbat', label: QUEUE_CABINET_UI.settings_tab, icon: BellIcon },
  { to: '/settings/malumot', label: EXPORT_UI.tab, icon: DatabaseIcon, permission: 'data.export' },
]
