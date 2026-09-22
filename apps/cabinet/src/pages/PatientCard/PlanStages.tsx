import { formatSom, PLAN_ITEM_STATUS_LABELS, PLAN_UI } from '@e-dentist/shared'
import { cn } from 'cn'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type { Plan, PlanItemDraft, PlanStageDraft } from '@/entities/plan'
import { ItemFormDialog, StageFormDialog, useSavePlanContent } from '@/features/plan-form'
import { Badge, Button, Card, DeleteDialog, DragHandle, ItemMenu, SortableList } from '@/shared/ui'

/// Serverga mazmun **butunligicha** yuboriladi, shuning uchun har amal
/// avval joriy holatdan nusxa oladi (PUT /plans/:id/content)
function toDrafts(plan: Plan): PlanStageDraft[] {
  return plan.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    note: stage.note,
    items: stage.items.map((item) => ({
      id: item.id,
      tooth: item.tooth,
      serviceId: item.serviceId,
      treatment: item.treatment,
      price: item.price,
      qty: item.qty,
      note: item.note,
    })),
  }))
}

type Editing = { stageId: string; item?: PlanItemDraft } | null

export function PlanStages({ plan, editable }: { plan: Plan; editable: boolean }) {
  // Tartib va tahrir natijasi darhol koʻrinadi — toast ortiqcha
  const { mutate: save } = useSavePlanContent(plan.id, { silent: true })

  const [stageForm, setStageForm] = useState<{ open: boolean; stageId?: string }>({ open: false })
  const [itemForm, setItemForm] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<{ stageId: string; itemId?: string } | null>(null)

  function apply(change: (drafts: PlanStageDraft[]) => PlanStageDraft[]) {
    save(change(toDrafts(plan)))
  }

  function saveStage(stage: Pick<PlanStageDraft, 'id' | 'name' | 'note'>) {
    apply((drafts) =>
      stage.id
        ? drafts.map((item) =>
            item.id === stage.id ? { ...item, name: stage.name, note: stage.note } : item,
          )
        : [...drafts, { ...stage, items: [] }],
    )
  }

  function saveItem(stageId: string, item: PlanItemDraft) {
    apply((drafts) =>
      drafts.map((stage) => {
        if (stage.id !== stageId) return stage
        const items = item.id
          ? stage.items.map((old) => (old.id === item.id ? item : old))
          : [...stage.items, item]
        return { ...stage, items }
      }),
    )
  }

  function remove({ stageId, itemId }: { stageId: string; itemId?: string }) {
    apply((drafts) =>
      itemId
        ? drafts.map((stage) =>
            stage.id === stageId
              ? { ...stage, items: stage.items.filter((item) => item.id !== itemId) }
              : stage,
          )
        : drafts.filter((stage) => stage.id !== stageId),
    )
  }

  function reorderStages(ids: string[]) {
    apply((drafts) => {
      const byId = new Map(drafts.map((stage) => [stage.id as string, stage]))
      return ids.flatMap((id) => byId.get(id) ?? [])
    })
  }

  function reorderItems(stageId: string, ids: string[]) {
    apply((drafts) =>
      drafts.map((stage) => {
        if (stage.id !== stageId) return stage
        const byId = new Map(stage.items.map((item) => [item.id as string, item]))
        return { ...stage, items: ids.flatMap((id) => byId.get(id) ?? []) }
      }),
    )
  }

  const editingStage = plan.stages.find((stage) => stage.id === stageForm.stageId)

  return (
    <>
      <SortableList
        items={plan.stages}
        getId={(stage) => stage.id}
        onReorder={reorderStages}
        className="space-y-3"
        renderItem={(stage, handle) => (
          <Card className="gap-2 p-3">
            <div className="flex items-center gap-1">
              {editable && <DragHandle handle={handle} label={PLAN_UI.drag_stage} />}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{stage.name}</div>
                {stage.note && <div className="text-muted-foreground text-xs">{stage.note}</div>}
              </div>
              <span className="text-muted-foreground text-sm tabular-nums">
                {formatSom(stage.total)}
              </span>
              {editable && (
                <ItemMenu
                  onEdit={() => setStageForm({ open: true, stageId: stage.id })}
                  onRemove={() => setDeleting({ stageId: stage.id })}
                />
              )}
            </div>

            {stage.items.length === 0 ? (
              <p className="text-muted-foreground px-1 text-sm">{PLAN_UI.stage_empty}</p>
            ) : (
              <SortableList
                items={stage.items}
                getId={(item) => item.id}
                onReorder={(ids) => reorderItems(stage.id, ids)}
                className="space-y-1"
                renderItem={(item, itemHandle) => (
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-lg border px-1 py-1.5',
                      item.status === 'done' && 'bg-ok/10',
                      item.status === 'skipped' && 'opacity-60',
                    )}
                  >
                    {editable && <DragHandle handle={itemHandle} label={PLAN_UI.drag_item} />}
                    <div className={cn('min-w-0 flex-1', !editable && 'pl-2')}>
                      {/* Tish rozetkasi matn oqimida: telefonning tor
                          ustunida u alohida qatorga tushib ketmasin */}
                      <div className="text-sm">
                        {item.tooth !== null && (
                          <span className="bg-muted mr-1.5 rounded px-1.5 py-0.5 text-xs tabular-nums">
                            {item.tooth}
                          </span>
                        )}
                        {item.treatment}
                        {item.status !== 'pending' && (
                          <Badge variant="outline" className="ml-1.5 text-xs">
                            {PLAN_ITEM_STATUS_LABELS[item.status]}
                          </Badge>
                        )}
                      </div>
                      {item.qty > 1 && (
                        <div className="text-muted-foreground text-xs tabular-nums">
                          {formatSom(item.price)} × {item.qty}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-muted-foreground text-xs">{item.note}</div>
                      )}
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatSom(item.total)}
                    </span>
                    {/* Bajarilgan band tahrirlanmaydi: u tashrifga bogʻlangan
                        va ish haqi hisobiga kirib boʻlgan */}
                    {editable && item.status === 'pending' && (
                      <ItemMenu
                        onEdit={() => setItemForm({ stageId: stage.id, item })}
                        onRemove={() => setDeleting({ stageId: stage.id, itemId: item.id })}
                      />
                    )}
                  </div>
                )}
              />
            )}

            {editable && (
              <button
                type="button"
                onClick={() => setItemForm({ stageId: stage.id })}
                className="text-primary hover:bg-accent flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm font-medium transition-colors"
              >
                <PlusIcon className="size-4" />
                {PLAN_UI.item_add}
              </button>
            )}
          </Card>
        )}
      />

      {editable && (
        <Button
          variant="outline"
          className="mt-3 w-full border-dashed"
          onClick={() => setStageForm({ open: true })}
        >
          <PlusIcon />
          {PLAN_UI.stage_add}
        </Button>
      )}

      <StageFormDialog
        open={stageForm.open}
        onOpenChange={(open) => setStageForm({ open })}
        stage={editingStage}
        onSave={saveStage}
      />
      <ItemFormDialog
        open={itemForm !== null}
        onOpenChange={(open) => !open && setItemForm(null)}
        item={itemForm?.item}
        onSave={(item) => itemForm && saveItem(itemForm.stageId, item)}
      />
      <DeleteDialog
        open={deleting !== null}
        title={deleting?.itemId ? PLAN_UI.item_delete_title : PLAN_UI.stage_delete_title}
        text={deleting?.itemId ? '' : PLAN_UI.stage_delete_text}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting)
          setDeleting(null)
        }}
      />
    </>
  )
}
