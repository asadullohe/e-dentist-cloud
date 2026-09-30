import {
  EXPORT_UI,
  FEEDBACK_CABINET_UI,
  LAB_UI,
  LOGO_UI,
  QUEUE_CABINET_UI,
  SETTINGS_UI,
  STAFF_UI,
} from '@e-dentist/shared'
import { useHasPermission, useSession } from '@/entities/session'
import { ClinicLogoCard } from '@/features/clinic-logo'
import { UpgradeCard } from '@/features/clinic-upgrade'
import { ContentSection } from '@/shared/ui'
import { AccountTab } from './AccountTab'
import { DataTab } from './DataTab'
import { FeedbackTab } from './FeedbackTab'
import { LabsTab } from './LabsTab'
import { QueueTab } from './QueueTab'
import { RolesTab } from './RolesTab'
import { StaffTab } from './StaffTab'

// Har boʻlim — nom, tavsif va mazmun. Marshrutlar router.tsx da

export function AccountSection() {
  return (
    <ContentSection heading="page" title={STAFF_UI.account_tab} desc={SETTINGS_UI.account_hint}>
      <AccountTab />
    </ContentSection>
  )
}

export function StaffSection() {
  return (
    <ContentSection heading="page" title={STAFF_UI.staff_tab} desc={SETTINGS_UI.staff_hint} wide>
      <StaffTab />
    </ContentSection>
  )
}

export function RolesSection() {
  return (
    <ContentSection heading="page" title={STAFF_UI.roles_tab} desc={SETTINGS_UI.roles_hint} wide>
      <RolesTab />
    </ContentSection>
  )
}

export function ClinicSection() {
  const solo = useSession().data?.clinic?.kind === 'solo'
  const canUpgrade = useHasPermission()('billing.manage')
  return (
    <ContentSection
      heading="page"
      title={solo ? LOGO_UI.tab_solo : LOGO_UI.tab}
      desc={solo ? SETTINGS_UI.clinic_hint_solo : SETTINGS_UI.clinic_hint}
    >
      <div className="space-y-4">
        <ClinicLogoCard />
        {/* Individualdan klinikaga — faqat egasiga (obuna masalasi) */}
        {solo && canUpgrade && <UpgradeCard />}
      </div>
    </ContentSection>
  )
}

export function QueueSection() {
  return (
    <ContentSection
      heading="page"
      title={QUEUE_CABINET_UI.settings_tab}
      desc={SETTINGS_UI.queue_hint}
    >
      <QueueTab />
    </ContentSection>
  )
}

export function FeedbackSection() {
  return (
    <ContentSection
      heading="page"
      title={FEEDBACK_CABINET_UI.tab}
      desc={SETTINGS_UI.feedback_hint}
      wide
    >
      <FeedbackTab />
    </ContentSection>
  )
}

export function DataSection() {
  return (
    <ContentSection heading="page" title={EXPORT_UI.tab} desc={SETTINGS_UI.data_hint}>
      <DataTab />
    </ContentSection>
  )
}

export function LabsSection() {
  return (
    <ContentSection heading="page" title={LAB_UI.labs_tab} desc={LAB_UI.labs_hint}>
      <LabsTab />
    </ContentSection>
  )
}
