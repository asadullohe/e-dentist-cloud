import { type Permission, SECTION_LABELS } from '@e-dentist/shared'
import {
  BellIcon,
  CalendarIcon,
  ChartColumnIcon,
  CreditCardIcon,
  FlaskConicalIcon,
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
  /// Shu ruxsat boʻlmasa boʻlim menyuda koʻrinmaydi.
  /// Diqqat: bu faqat koʻrinish — haqiqiy himoya serverda
  permission: Permission
  /// Yon menyuda ochiladigan ichki havolalar (sozlamalar boʻlimlari)
  children?: readonly SettingsItem[]
}

/// Funksiya, konstanta emas — matnlar joriy tilda oʻqilishi uchun
export const navSections = (): readonly NavSection[] => [
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
  {
    path: '/settings',
    label: SECTION_LABELS.settings,
    icon: SettingsIcon,
    permission: 'staff.manage',
    children: settingsItems(),
  },
]
