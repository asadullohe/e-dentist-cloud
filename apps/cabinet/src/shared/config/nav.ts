import { type Permission, SECTION_LABELS } from '@e-dentist/shared'

export interface NavSection {
  path: string
  label: string
  icon: string
  /// Shu ruxsat boʻlmasa boʻlim menyuda koʻrinmaydi.
  /// Diqqat: bu faqat koʻrinish — haqiqiy himoya serverda
  permission: Permission
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { path: '/patients', label: SECTION_LABELS.patients, icon: '👥', permission: 'patients.read' },
  { path: '/schedule', label: SECTION_LABELS.schedule, icon: '📅', permission: 'schedule.write' },
  { path: '/lab', label: SECTION_LABELS.lab, icon: '🦷', permission: 'lab.own' },
  { path: '/debtors', label: SECTION_LABELS.debtors, icon: '💳', permission: 'payments.read' },
  { path: '/services', label: SECTION_LABELS.services, icon: '🏷', permission: 'services.manage' },
  { path: '/expenses', label: SECTION_LABELS.expenses, icon: '🧾', permission: 'expenses.read' },
  { path: '/reports', label: SECTION_LABELS.reports, icon: '📊', permission: 'reports.read' },
  { path: '/settings', label: SECTION_LABELS.settings, icon: '⚙️', permission: 'staff.manage' },
]
