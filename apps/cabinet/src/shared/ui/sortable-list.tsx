import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from 'cn'
import { GripVerticalIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/// Tutqich: tortish faqat shu tugmadan — kartaning oʻzi bosilganda ochiladi,
/// tortilmaydi. Elementga `useSortable` bergan atributlar tarqatiladi
export interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: Record<string, unknown> | undefined
}

export function DragHandle({
  handle,
  label,
  className,
}: {
  handle: DragHandleProps
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'text-muted-foreground hover:text-foreground flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md active:cursor-grabbing',
        className,
      )}
      {...handle.attributes}
      {...handle.listeners}
    >
      <GripVerticalIcon className="size-4" aria-hidden="true" />
    </button>
  )
}

function SortableItem({
  id,
  children,
  className,
}: {
  id: string
  children: (handle: DragHandleProps) => ReactNode
  className?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-80', className)}
    >
      {children({ attributes, listeners })}
    </div>
  )
}

/// Tortib tartiblanadigan roʻyxat yoki panjara. Elementlar oʻzi chiziladi
/// (`renderItem`), tutqich `DragHandle` orqali. Tartib oʻzgarganda yangi
/// ketma-ketlik idlari qaytariladi — saqlash chaqiruvchining ishi.
/// Barmoq: 200 ms ushlab turib tortiladi — oddiy aylantirish buzilmasin
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  layout = 'list',
  className,
  itemClassName,
  trailing,
}: {
  items: readonly T[]
  getId: (item: T) => string
  onReorder: (ids: string[]) => void
  renderItem: (item: T, handle: DragHandleProps) => ReactNode
  layout?: 'list' | 'grid'
  className?: string
  itemClassName?: string
  /// Roʻyxat oxiridagi tortilmaydigan element — masalan, «+ qoʻshish» plitkasi
  trailing?: ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map(getId)

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={ids}
        strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={getId(item)} id={getId(item)} className={itemClassName}>
              {(handle) => renderItem(item, handle)}
            </SortableItem>
          ))}
          {trailing}
        </div>
      </SortableContext>
    </DndContext>
  )
}
