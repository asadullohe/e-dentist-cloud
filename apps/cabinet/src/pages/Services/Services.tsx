import { formatSom, SERVICE_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { LayersIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ServiceType, useServices, useServiceTypes } from '@/entities/service'
import {
  ServiceTypeDialog,
  useDeleteServiceType,
  useReorderServiceTypes,
} from '@/features/service-form'
import {
  Button,
  DeleteDialog,
  DragHandle,
  type DragHandleProps,
  EmptyState,
  Input,
  ItemMenu,
  Skeleton,
  SortableList,
} from '@/shared/ui'

/// Xizmatlar katalogi: tur plitkalari (tortib tartiblanadi), bosilsa —
/// turning xizmatlari. Qidiruv hamma turdan izlaydi
export function Services() {
  const navigate = useNavigate()
  const { data: types, isPending } = useServiceTypes()
  const { data: services } = useServices()
  const { mutateAsync: remove } = useDeleteServiceType()
  const { mutate: reorder } = useReorderServiceTypes()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceType | undefined>(undefined)
  const [deleting, setDeleting] = useState<ServiceType | null>(null)

  // Tartib avval shu yerda almashadi (server javobini kutmasdan), keyin
  // saqlanadi; rad etilsa roʻyxat qayta soʻraladi va oʻz holiga qaytadi
  const [ordered, setOrdered] = useState<ServiceType[]>([])
  useEffect(() => setOrdered(types ?? []), [types])
  function onReorder(ids: string[]) {
    const byId = new Map(ordered.map((type) => [type.id, type]))
    setOrdered(ids.flatMap((id) => byId.get(id) ?? []))
    reorder(ids)
  }

  const q = query.trim().toLowerCase()
  const found = q ? (services ?? []).filter((item) => item.name.toLowerCase().includes(q)) : []

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{SERVICE_UI.title}</h1>
          {types && services && (
            <p className="text-muted-foreground text-sm">
              {SERVICE_UI.summary(types.length, services.length)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <PlusIcon />
          {SERVICE_UI.type_add}
        </Button>
      </div>

      <div className="relative mb-4">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SERVICE_UI.search}
          className="pl-8"
        />
      </div>

      {q ? (
        found.length === 0 ? (
          <EmptyState icon={SearchIcon} text={SERVICE_UI.nothing_found} />
        ) : (
          <ul className="space-y-2">
            {found.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/services/${item.typeId}`}
                  className="bg-card hover:bg-accent flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xs transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.name}</div>
                    <div className="text-muted-foreground text-xs">{item.typeName}</div>
                  </div>
                  <span className="font-semibold tabular-nums">{formatSom(item.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : isPending ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <SortableList
          items={ordered}
          getId={(type) => type.id}
          onReorder={onReorder}
          layout="grid"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
          renderItem={(type, handle) => (
            <TypeTile
              type={type}
              handle={handle}
              onOpen={() => navigate(`/services/${type.id}`)}
              onEdit={() => {
                setEditing(type)
                setFormOpen(true)
              }}
              onRemove={() => setDeleting(type)}
            />
          )}
          trailing={
            <button
              type="button"
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
              className="text-primary hover:bg-accent flex min-h-32 items-center justify-center gap-1.5 rounded-2xl border border-dashed text-sm font-medium transition-colors"
            >
              <PlusIcon className="size-4" />
              {SERVICE_UI.type_add}
            </button>
          }
        />
      )}
      {!q && !isPending && ordered.length === 0 && (
        <p className="text-muted-foreground mt-3 text-sm">{SERVICE_UI.empty_types}</p>
      )}

      <ServiceTypeDialog open={formOpen} onOpenChange={setFormOpen} type={editing} />
      <DeleteDialog
        open={deleting !== null}
        title={SERVICE_UI.type_delete_title}
        text={SERVICE_UI.type_delete_text}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove(deleting.id)
          setDeleting(null)
        }}
      />
    </>
  )
}

/// Tur plitkasi: butun plitka — turga kirish; tutqich va «⋯» oʻz ishini qiladi
function TypeTile({
  type,
  handle,
  onOpen,
  onEdit,
  onRemove,
}: {
  type: ServiceType
  handle: DragHandleProps
  onOpen: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ichida tugmalar bor — plitka oʻzi tugma boʻla olmaydi
    // biome-ignore lint/a11y/useKeyWithClickEvents: klaviatura uchun ichidagi «Ochish» havolasi
    <div
      onClick={onOpen}
      className={cn(
        'bg-card hover:bg-accent/60 relative flex min-h-32 cursor-pointer flex-col gap-2 rounded-2xl border p-3 shadow-xs transition-colors',
      )}
    >
      <div className="flex items-start">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <LayersIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="ml-auto flex items-center">
          <DragHandle handle={handle} label={SERVICE_UI.drag} />
          <ItemMenu onEdit={onEdit} onRemove={onRemove} />
        </div>
      </div>
      <div className="mt-auto min-w-0">
        <Link
          to={`/services/${type.id}`}
          onClick={(event) => event.stopPropagation()}
          className="line-clamp-2 font-semibold leading-tight outline-none focus-visible:underline"
        >
          {type.name}
        </Link>
        <div className="text-muted-foreground text-xs">
          {SERVICE_UI.type_count(type.serviceCount)}
        </div>
      </div>
    </div>
  )
}
