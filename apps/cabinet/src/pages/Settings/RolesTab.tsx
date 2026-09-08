import {
  OWNER_REQUIRED_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSIONS,
  type Permission,
  STAFF_UI,
  UI_TEXT,
} from '@e-dentist/shared'
import { useState } from 'react'
import { type Role, useRoles } from '@/entities/staff'
import { useUpdateRole } from '@/features/staff-manage'
import { ApiError } from '@/shared/api'
import { Badge, Button, Card, Checkbox, Label, Skeleton } from '@/shared/ui'

/// Egasi majburiy ruxsatlarni yoʻqota olmaydi — server ham rad etadi,
/// interfeys esa katakchani ochiq qoldirmaydi (tz.md 6-boʻlim)
function isLocked(role: Role, permission: Permission): boolean {
  return role.isOwner && OWNER_REQUIRED_PERMISSIONS.includes(permission)
}

function RoleCard({ role }: { role: Role }) {
  const { mutateAsync, isPending } = useUpdateRole()
  const [selected, setSelected] = useState<Permission[]>(role.permissions)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const changed =
    selected.length !== role.permissions.length ||
    selected.some((permission) => !role.permissions.includes(permission))

  function toggle(permission: Permission, on: boolean) {
    setSaved(false)
    setSelected((current) =>
      on ? [...current, permission] : current.filter((item) => item !== permission),
    )
  }

  async function save() {
    setError('')
    try {
      await mutateAsync({ id: role.id, permissions: selected })
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : UI_TEXT.offline)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display font-semibold">{role.name}</h3>
        {role.isOwner && <Badge variant="secondary">{STAFF_UI.owner_locked}</Badge>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSIONS.map((permission) => {
          const id = `${role.id}-${permission}`
          const locked = isLocked(role, permission)
          return (
            <div key={permission} className="flex items-center gap-2">
              <Checkbox
                id={id}
                disabled={locked}
                checked={selected.includes(permission)}
                onCheckedChange={(state) => toggle(permission, state === true)}
              />
              <Label htmlFor={id} className="text-sm font-normal">
                {PERMISSION_LABELS[permission]}
              </Label>
            </div>
          )
        })}
      </div>

      {error && <p className="text-destructive text-sm font-medium">{error}</p>}

      <div className="flex items-center gap-3">
        <Button size="sm" disabled={!changed || isPending} onClick={save}>
          {isPending ? UI_TEXT.loading : STAFF_UI.save_role}
        </Button>
        {saved && !changed && <span className="text-ok text-sm">{STAFF_UI.role_saved}</span>}
      </div>
    </Card>
  )
}

export function RolesTab() {
  const { data: roles, isPending } = useRoles()

  if (isPending) return <Skeleton className="h-40 w-full" />

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Kalit faqat id: saqlangandan keyin karta qayta chizilsin, lekin
          holatini yoʻqotmasin — «Rol yangilandi» yozuvi shunda koʻrinadi */}
      {roles?.map((role) => (
        <RoleCard key={role.id} role={role} />
      ))}
    </div>
  )
}
