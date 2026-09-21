import {
  EXPORT_UI,
  FEEDBACK_CABINET_UI,
  LOGO_UI,
  QUEUE_CABINET_UI,
  SETTINGS_UI,
  STAFF_UI,
} from '@e-dentist/shared'
import { ClinicLogoCard } from '@/features/clinic-logo'
import { ContentSection } from '@/shared/ui'
import { AccountTab } from './AccountTab'
import { DataTab } from './DataTab'
import { FeedbackTab } from './FeedbackTab'
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
  return (
    <ContentSection heading="page" title={LOGO_UI.tab} desc={SETTINGS_UI.clinic_hint}>
      <ClinicLogoCard />
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
