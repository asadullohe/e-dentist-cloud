import { formatSom, PLAN_UI } from '@e-dentist/shared'
import { crownMaterialLabel } from '@e-dentist/teeth'
import type { PlanGroup, PlanItem } from '@/entities/plan'
import { DragHandle, type DragHandleProps, ItemMenu } from '@/shared/ui'
import { PlanItemRow } from './PlanItemRow'

interface PlanGroupBlockProps {
  group: PlanGroup
  items: PlanItem[]
  editable: boolean
  handle: DragHandleProps
  onComplete(item: PlanItem): void
  onSkip(item: PlanItem, skip: boolean): void
  onRemove(): void
}

/// Koʻprik rejada bitta blok boʻlib koʻrinadi (15.2), lekin ichidagi har
/// band mustaqil: alohida «bajarildi», alohida ulush. Guruh ichida tartib
/// oʻzgarmaydi — u oraliqning oʻzi, shuning uchun bandlarda dastak yoʻq
export function PlanGroupBlock({
  group,
  items,
  editable,
  handle,
  onComplete,
  onSkip,
  onRemove,
}: PlanGroupBlockProps) {
  const total = items.reduce((sum, item) => sum + item.total, 0)
  const material = crownMaterialLabel(group.material ?? '')

  return (
    <div className="border-primary/30 bg-primary/5 rounded-lg border p-1.5">
      <div className="flex items-center gap-1 px-1">
        {editable && <DragHandle handle={handle} label={PLAN_UI.drag_item} />}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{group.name}</div>
          <div className="text-muted-foreground text-xs">
            {PLAN_UI.bridge_total(group.teeth.length)}
            {group.material && ` · ${material}`}
          </div>
        </div>
        <span className="text-sm font-medium tabular-nums">{formatSom(total)}</span>
        {editable && <ItemMenu onRemove={onRemove} />}
      </div>

      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <PlanItemRow
            key={item.id}
            item={item}
            editable={editable}
            role={
              item.tooth !== null && group.pontics.includes(item.tooth)
                ? PLAN_UI.role_pontic
                : PLAN_UI.role_abutment
            }
            onComplete={() => onComplete(item)}
            onSkip={(skip) => onSkip(item, skip)}
          />
        ))}
      </div>
    </div>
  )
}
