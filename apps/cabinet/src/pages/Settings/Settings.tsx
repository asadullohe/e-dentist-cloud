import { SETTINGS_UI } from '@e-dentist/shared'
import { Outlet } from 'react-router-dom'
import { Separator, SideNavLayout } from '@/shared/ui'
import { SettingsNav } from './SettingsNav'

/// Sozlamalar — chapda boʻlimlar roʻyxati, oʻngda tanlangan boʻlim.
/// Har boʻlim oʻz manziliga ega: havolani ulashish va «orqaga» ishlaydi
export function Settings() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">{SETTINGS_UI.title}</h1>
        <p className="text-muted-foreground">{SETTINGS_UI.hint}</p>
      </div>
      <Separator className="my-4 lg:my-6" />
      <SideNavLayout nav={<SettingsNav />}>
        <Outlet />
      </SideNavLayout>
    </div>
  )
}
