import { formatSom, SERVICE_UI } from '@e-dentist/shared'
import { ChevronLeftIcon, PlusIcon, TagIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { type Service, useServices, useServiceTypes } from '@/entities/service'
import { ServiceFormDialog, useDeleteService, useReorderServices } from '@/features/service-form'
import {
  Button,
  DeleteDialog,
  DragHandle,
  EmptyState,
  ItemMenu,
  Skeleton,
  SortableList,
} from '@/shared/ui'

/// Bitta turning xizmatlari: karta (nom · narx · «⋯»), tortib tartiblanadi
export function ServiceTypePage() {
  const { typeId = '' } = useParams()
  const { data: types, isPending: typesPending } = useServiceTypes()
  const { data: services, isPending } = useServices()
  const { mutateAsync: remove } = useDeleteService()
  const { mutate: reorder } = useReorderServices(typeId)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)
  const [deleting, setDeleting] = useState<Service | null>(null)

  const type = types?.find((item) => item.id === typeId)
  // useMemo: har renderda yangi massiv boʻlsa quyidagi effekt aylanib qoladi
  const own = useMemo(() => services?.filter((item) => item.typeId === typeId), [services, typeId])

  // Tartib avval shu yerda, keyin serverda (Services sahifasi bilan bir xil)
  const [ordered, setOrdered] = useState<Service[]>([])
  useEffect(() => setOrdered(own ?? []), [own])
  function onReorder(ids: string[]) {
    const byId = new Map(ordered.map((item) => [item.id, item]))
    setOrdered(ids.flatMap((id) => byId.get(id) ?? []))
    reorder(ids)
  }

  // Tur yoʻq (oʻchirilgan yoki begona) — katalogga
  if (!typesPending && types && !type) return <Navigate to="/services" replace />

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <Link
        to="/services"
        className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeftIcon className="size-4" />
        {SERVICE_UI.back}
      </Link>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {type?.name ?? <Skeleton className="h-7 w-40" />}
          </h1>
          {own && (
            <p className="text-muted-foreground text-sm">{SERVICE_UI.type_count(own.length)}</p>
          )}
        </div>
        <Button size="sm" onClick={openNew}>
          <PlusIcon />
          {SERVICE_UI.add}
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState icon={TagIcon} text={SERVICE_UI.empty} />
      ) : (
        <SortableList
          items={ordered}
          getId={(item) => item.id}
          onReorder={onReorder}
          className="space-y-2"
          renderItem={(item, handle) => (
            <div className="bg-card flex items-center gap-2 rounded-xl border py-2 pr-2 pl-1 shadow-xs">
              <DragHandle handle={handle} label={SERVICE_UI.drag} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.name}</div>
                {item.techPrice !== null && (
                  <div className="text-muted-foreground text-xs tabular-nums">
                    {SERVICE_UI.tech_short(formatSom(item.techPrice))}
                  </div>
                )}
              </div>
              <span className="font-semibold tabular-nums">{formatSom(item.price)}</span>
              <ItemMenu
                onEdit={() => {
                  setEditing(item)
                  setFormOpen(true)
                }}
                onRemove={() => setDeleting(item)}
              />
            </div>
          )}
          trailing={
            <button
              type="button"
              onClick={openNew}
              className="text-primary hover:bg-accent flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-medium transition-colors"
            >
              <PlusIcon className="size-4" />
              {SERVICE_UI.add}
            </button>
          }
        />
      )}

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        defaultTypeId={typeId}
      />
      <DeleteDialog
        open={deleting !== null}
        title={SERVICE_UI.delete_title}
        text={SERVICE_UI.delete_text}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}
