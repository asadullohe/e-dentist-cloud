import { EXPORT_UI, QUEUE_CABINET_UI, STAFF_UI } from '@e-dentist/shared'
import { useHasPermission } from '@/entities/session'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
import { DataTab } from './DataTab'
import { QueueTab } from './QueueTab'
import { RolesTab } from './RolesTab'
import { StaffTab } from './StaffTab'

export function Settings() {
  const hasPermission = useHasPermission()

  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{STAFF_UI.title}</h1>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">{STAFF_UI.staff_tab}</TabsTrigger>
          <TabsTrigger value="roles">{STAFF_UI.roles_tab}</TabsTrigger>
          <TabsTrigger value="queue">{QUEUE_CABINET_UI.settings_tab}</TabsTrigger>
          {hasPermission('data.export') && <TabsTrigger value="data">{EXPORT_UI.tab}</TabsTrigger>}
        </TabsList>
        <TabsContent value="staff" className="mt-3">
          <StaffTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-3">
          <RolesTab />
        </TabsContent>
        <TabsContent value="queue" className="mt-3">
          <QueueTab />
        </TabsContent>
        {hasPermission('data.export') && (
          <TabsContent value="data" className="mt-3">
            <DataTab />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
