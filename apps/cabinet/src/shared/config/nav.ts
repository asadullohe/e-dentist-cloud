import { type Permission, SECTION_LABELS } from '@e-dentist/shared'
import {
  BanknoteIcon,
  BellIcon,
  CalendarIcon,
  ChartColumnIcon,
  CreditCardIcon,
  FlaskConicalIcon,
  HouseIcon,
  type LucideIcon,
  ReceiptIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from 'lucide-react'
import { type SettingsItem, settingsItems } from './settingsNav'

export interface NavSection {
  path: string
  label: string
  icon: LucideIcon
  /// Shu ruxsat boʻlmasa boʻlim menyuda koʻrinmaydi. Berilmasa — hammaga.
  /// Diqqat: bu faqat koʻrinish — haqiqiy himoya serverda
  permission?: Permission | readonly Permission[]
  /// Yon menyuda ochiladigan ichki havolalar (sozlamalar boʻlimlari)
  children?: readonly SettingsItem[]
}

/// Funksiya, konstanta emas — matnlar joriy tilda oʻqilishi uchun
export const navSections = (): readonly NavSection[] => [
  // Bosh sahifa — kirgan har kimga; qolgan boʻlimlar ruxsatga qarab
  { path: '/', label: SECTION_LABELS.home, icon: HouseIcon },
  {
    path: '/patients',
    label: SECTION_LABELS.patients,
    icon: UsersIcon,
    permission: 'patients.read',
  },
  {
    path: '/schedule',
    label: SECTION_LABELS.schedule,
    icon: CalendarIcon,
    permission: 'schedule.write',
  },
  { path: '/queue', label: SECTION_LABELS.queue, icon: BellIcon, permission: 'queue.manage' },
  { path: '/lab', label: SECTION_LABELS.lab, icon: FlaskConicalIcon, permission: 'lab.own' },
  {
    path: '/debtors',
    label: SECTION_LABELS.debtors,
    icon: CreditCardIcon,
    permission: 'payments.read',
  },
  {
    path: '/services',
    label: SECTION_LABELS.services,
    icon: TagIcon,
    permission: 'services.manage',
  },
  {
    path: '/expenses',
    label: SECTION_LABELS.expenses,
    icon: ReceiptIcon,
    permission: 'expenses.read',
  },
  {
    path: '/reports',
    label: SECTION_LABELS.reports,
    icon: ChartColumnIcon,
    permission: 'reports.read',
  },
  // Egasida ikkalasi ham bor; shifokorda faqat `own` — shuning uchun `own`
  {
    path: '/payroll',
    label: SECTION_LABELS.payroll,
    icon: BanknoteIcon,
    permission: 'payroll.own',
  },
  // Hammaga: ichida «Hisobim» bor. Qolgan boʻlimlar oʻz ruxsati bilan
  {
    path: '/settings',
    label: SECTION_LABELS.settings,
    icon: SettingsIcon,
    children: settingsItems(),
  },
]
