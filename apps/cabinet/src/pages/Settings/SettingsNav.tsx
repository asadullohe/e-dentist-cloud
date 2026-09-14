import { useHasPermission } from '@/entities/session'
import { settingsItems } from '@/shared/config'
import { SideNav } from '@/shared/ui'

export function SettingsNav() {
  const hasPermission = useHasPermission()
  const items = settingsItems().filter((item) => !item.permission || hasPermission(item.permission))
  return <SideNav items={items} />
}
