import { STAFF_UI } from '@e-dentist/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
import { RolesTab } from './RolesTab'
import { StaffTab } from './StaffTab'

export function Settings() {
  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{STAFF_UI.title}</h1>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">{STAFF_UI.staff_tab}</TabsTrigger>
          <TabsTrigger value="roles">{STAFF_UI.roles_tab}</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-3">
          <StaffTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-3">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
