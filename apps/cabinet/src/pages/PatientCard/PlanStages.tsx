import { formatSom, PLAN_UI } from '@e-dentist/shared'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type {
  Plan,
  PlanGroup,
  PlanGroupDraft,
  PlanItem,
  PlanItemDraft,
  PlanStage,
  PlanStageDraft,
} from '@/entities/plan'
import {
  BridgeFormDialog,
  ItemFormDialog,
  StageFormDialog,
  useSavePlanContent,
  useSkipPlanItem,
} from '@/features/plan-form'
import { VisitFormDialog } from '@/features/visit-form'
import { Button, Card, DeleteDialog, DragHandle, ItemMenu, SortableList } from '@/shared/ui'
import { PlanGroupBlock } from './PlanGroupBlock'
import { PlanItemRow } from './PlanItemRow'

/// Serverga mazmun **butunligicha** yuboriladi, shuning uchun har amal
/// avval joriy holatdan nusxa oladi (PUT /plans/:id/content)
function toDrafts(plan: Plan): PlanStageDraft[] {
  return plan.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    note: stage.note,
    groups: stage.groups.map((group) => ({
      id: group.id,
      name: group.name,
      teeth: group.teeth,
      pontics: group.pontics,
      material: group.material,
    })),
    items: stage.items.map((item) => ({
      id: item.id,
      // Serverga indeks ketadi: yangi guruhning idsi hali berilmagan
      groupIndex:
        item.groupId === null ? null : stage.groups.findIndex((row) => row.id === item.groupId),
      tooth: item.tooth,
      serviceId: item.serviceId,
      treatment: item.treatment,
      price: item.price,
      qty: item.qty,
      note: item.note,
    })),
  }))
}

/// Bosqich ichidagi koʻrinadigan birlik: koʻprik guruhi yoki yakka band.
/// Tortish ham shu birliklar boʻyicha — guruh bandlari birga koʻchadi
type Block =
  | { kind: 'group'; id: string; group: PlanGroup; items: PlanItem[] }
  | { kind: 'item'; id: string; item: PlanItem }

function toBlocks(stage: PlanStage): Block[] {
  const blocks: Block[] = []
  const seen = new Set<string>()
  for (const item of stage.items) {
    const group =
      item.groupId === null ? undefined : stage.groups.find((row) => row.id === item.groupId)
    // Guruhi oʻchirilgan band yakka qoladi
    if (!group) {
      blocks.push({ kind: 'item', id: item.id, item })
      continue
    }
    if (seen.has(group.id)) continue
    seen.add(group.id)
    blocks.push({
      kind: 'group',
      id: group.id,
      group,
      items: stage.items.filter((row) => row.groupId === group.id),
    })
  }
  return blocks
}

type Editing = { stageId: string; item?: PlanItemDraft } | null

export function PlanStages({ plan, editable }: { plan: Plan; editable: boolean }) {
  // Tartib va tahrir natijasi darhol koʻrinadi — toast ortiqcha
  const { mutate: save } = useSavePlanContent(plan.id, { silent: true })
  const { mutate: skipItem } = useSkipPlanItem(plan.id)

  const [stageForm, setStageForm] = useState<{ open: boolean; stageId?: string }>({ open: false })
  const [itemForm, setItemForm] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<{
    stageId: string
    itemId?: string
    groupId?: string
  } | null>(null)
  /// Koʻprik qaysi bosqichga qoʻshilyapti
  const [bridgeStageId, setBridgeStageId] = useState<string | null>(null)
  /// Bajarilayotgan band — tashrif formasi shu band bilan toʻldiriladi
  const [completing, setCompleting] = useState<PlanItem | null>(null)

  function apply(change: (drafts: PlanStageDraft[]) => PlanStageDraft[]) {
    save(change(toDrafts(plan)))
  }

  function saveStage(stage: Pick<PlanStageDraft, 'id' | 'name' | 'note'>) {
    apply((drafts) =>
      stage.id
        ? drafts.map((item) =>
            item.id === stage.id ? { ...item, name: stage.name, note: stage.note } : item,
          )
        : [...drafts, { ...stage, groups: [], items: [] }],
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

  /// Koʻprik: guruh va oraliqdagi har tish uchun bitta band birga qoʻshiladi
  function saveBridge(stageId: string, group: PlanGroupDraft, items: PlanItemDraft[]) {
    apply((drafts) =>
      drafts.map((stage) => {
        if (stage.id !== stageId) return stage
        const groupIndex = stage.groups.length
        return {
          ...stage,
          groups: [...stage.groups, group],
          items: [...stage.items, ...items.map((item) => ({ ...item, groupIndex }))],
        }
      }),
    )
  }

  /// Koʻprikni oʻchirish — guruh ham, ichidagi bandlar ham. Bajarilgan band
  /// boʻlsa server rad etadi
  function removeGroup(stageId: string, groupId: string) {
    const stage = plan.stages.find((row) => row.id === stageId)
    const index = stage?.groups.findIndex((row) => row.id === groupId) ?? -1
    if (index < 0) return
    apply((drafts) =>
      drafts.map((draft) => {
        if (draft.id !== stageId) return draft
        return {
          ...draft,
          groups: draft.groups.filter((_, at) => at !== index),
          items: draft.items
            .filter((item) => item.groupIndex !== index)
            // Qolgan guruhlarning indekslari surildi
            .map((item) => ({
              ...item,
              groupIndex:
                item.groupIndex == null || item.groupIndex < index
                  ? item.groupIndex
                  : item.groupIndex - 1,
            })),
        }
      }),
    )
  }

  /// Tortilgani — blok (guruh yoki yakka band). Guruh bandlari ketma-ket
  /// turadi, shuning uchun tartib bloklar boʻyicha qayta yigʻiladi
  function reorderBlocks(stageId: string, ids: string[]) {
    const stage = plan.stages.find((row) => row.id === stageId)
    if (!stage) return
    apply((drafts) =>
      drafts.map((draft) => {
        if (draft.id !== stageId) return draft
        const byBlock = new Map<string, PlanItemDraft[]>()
        for (const item of draft.items) {
          const key =
            item.groupIndex == null
              ? (item.id as string)
              : (stage.groups[item.groupIndex]?.id ?? (item.id as string))
          byBlock.set(key, [...(byBlock.get(key) ?? []), item])
        }
        return { ...draft, items: ids.flatMap((id) => byBlock.get(id) ?? []) }
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
                items={toBlocks(stage)}
                getId={(block) => block.id}
                onReorder={(ids) => reorderBlocks(stage.id, ids)}
                className="space-y-1"
                renderItem={(block, blockHandle) =>
                  block.kind === 'group' ? (
                    <PlanGroupBlock
                      group={block.group}
                      items={block.items}
                      editable={editable}
                      handle={blockHandle}
                      onComplete={setCompleting}
                      onSkip={(item, skip) => skipItem({ itemId: item.id, skip })}
                      onRemove={() => setDeleting({ stageId: stage.id, groupId: block.group.id })}
                    />
                  ) : (
                    <PlanItemRow
                      item={block.item}
                      editable={editable}
                      handle={blockHandle}
                      onComplete={() => setCompleting(block.item)}
                      onEdit={() => setItemForm({ stageId: stage.id, item: block.item })}
                      onSkip={(skip) => skipItem({ itemId: block.item.id, skip })}
                      onRemove={() => setDeleting({ stageId: stage.id, itemId: block.item.id })}
                    />
                  )
                }
              />
            )}

            {editable && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setItemForm({ stageId: stage.id })}
                  className="text-primary hover:bg-accent flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm font-medium transition-colors"
                >
                  <PlusIcon className="size-4" />
                  {PLAN_UI.item_add}
                </button>
                {/* Koʻprik alohida tugma: oraliq va rollar bir oynada
                    tanlanadi, bandlar oʻzi yoziladi (15.2) */}
                <button
                  type="button"
                  onClick={() => setBridgeStageId(stage.id)}
                  className="text-primary hover:bg-accent flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 text-sm font-medium transition-colors"
                >
                  <PlusIcon className="size-4" />
                  {PLAN_UI.bridge_add}
                </button>
              </div>
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
      <BridgeFormDialog
        open={bridgeStageId !== null}
        onOpenChange={(open) => !open && setBridgeStageId(null)}
        patientId={plan.patientId}
        onSave={(group, items) => bridgeStageId && saveBridge(bridgeStageId, group, items)}
      />
      {/* Ish qilingani tashrif bilan isbotlanadi (13.4): forma rejadan
          toʻldiriladi, saqlansa band ham yopiladi */}
      {completing && (
        <VisitFormDialog
          open
          onOpenChange={(open) => !open && setCompleting(null)}
          patientId={plan.patientId}
          planItem={{
            planId: plan.id,
            itemId: completing.id,
            doctorId: plan.doctorId,
            treatment: completing.treatment,
            tooth: completing.tooth,
            serviceId: completing.serviceId,
            price: completing.total,
          }}
        />
      )}
      <DeleteDialog
        open={deleting !== null}
        title={
          deleting?.groupId
            ? PLAN_UI.bridge_delete_title
            : deleting?.itemId
              ? PLAN_UI.item_delete_title
              : PLAN_UI.stage_delete_title
        }
        text={
          deleting?.groupId
            ? PLAN_UI.bridge_delete_text
            : deleting?.itemId
              ? ''
              : PLAN_UI.stage_delete_text
        }
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (deleting?.groupId) removeGroup(deleting.stageId, deleting.groupId)
          else if (deleting) remove(deleting)
          setDeleting(null)
        }}
      />
    </>
  )
}
