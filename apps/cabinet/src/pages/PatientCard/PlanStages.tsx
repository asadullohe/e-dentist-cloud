import { formatSom, PLAN_UI } from '@e-dentist/shared'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type { Plan, PlanGroupDraft, PlanItem, PlanItemDraft, PlanStageDraft } from '@/entities/plan'
import {
  BridgeFormDialog,
  ItemFormDialog,
  StageFormDialog,
  useSavePlanContent,
  useSkipPlanItem,
} from '@/features/plan-form'
import { VisitFormDialog } from '@/features/visit-form'
import { Button, Card, DeleteDialog, DragHandle, ItemMenu, SortableList } from '@/shared/ui'
import { PlanChart } from './PlanChart'
import { PlanGroupBlock } from './PlanGroupBlock'
import { PlanItemRow } from './PlanItemRow'
import * as drafts from './planDrafts'

/// Ochilgan «ish» oynasi: bosqich, tahrirlanayotgan band yoki xaritadan
/// kelgan tish
type Editing = { stageId: string; item?: PlanItemDraft; tooth?: number } | null

/// Koʻprik oynasi: bosqich va xaritadan kelgan oraliq
type Bridging = { stageId: string; span?: { from: number; to: number } } | null

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
  const [bridgeForm, setBridgeForm] = useState<Bridging>(null)
  /// Bajarilayotgan band — tashrif formasi shu band bilan toʻldiriladi
  const [completing, setCompleting] = useState<PlanItem | null>(null)

  function apply(change: (rows: PlanStageDraft[]) => PlanStageDraft[]) {
    save(change(drafts.toDrafts(plan)))
  }

  function saveItem(stageId: string, item: PlanItemDraft) {
    apply(drafts.putItem(stageId, item))
  }

  function saveBridge(stageId: string, group: PlanGroupDraft, items: PlanItemDraft[]) {
    apply(drafts.putBridge(stageId, group, items))
  }

  function remove({ stageId, itemId }: { stageId: string; itemId?: string }) {
    apply(itemId ? drafts.dropItem(stageId, itemId) : drafts.dropStage(stageId))
  }

  function removeGroup(stageId: string, groupId: string) {
    const index = plan.stages
      .find((row) => row.id === stageId)
      ?.groups.findIndex((row) => row.id === groupId)
    if (index === undefined || index < 0) return
    apply(drafts.dropGroup(stageId, index))
  }

  function reorderBlocks(stageId: string, ids: string[]) {
    const groupIds = plan.stages.find((row) => row.id === stageId)?.groups.map((row) => row.id)
    if (!groupIds) return
    apply(drafts.orderBlocks(stageId, ids, groupIds))
  }

  const editingStage = plan.stages.find((stage) => stage.id === stageForm.stageId)

  return (
    <>
      {/* Xaritadan ishlash (15.3): tish bosilsa oʻsha tish bilan oyna
          ochiladi, koʻprik rejimida ikki tish oraliqni yopadi */}
      <PlanChart
        plan={plan}
        editable={editable}
        onPickTooth={(stageId, tooth) => setItemForm({ stageId, tooth })}
        onPickSpan={(stageId, from, to) => setBridgeForm({ stageId, span: { from, to } })}
      />

      <SortableList
        items={plan.stages}
        getId={(stage) => stage.id}
        onReorder={(ids) => apply(drafts.orderStages(ids))}
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
                items={drafts.toBlocks(stage)}
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
                  onClick={() => setBridgeForm({ stageId: stage.id })}
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
        onSave={(stage) => apply(drafts.putStage(stage))}
      />
      <ItemFormDialog
        open={itemForm !== null}
        onOpenChange={(open) => !open && setItemForm(null)}
        item={itemForm?.item}
        defaultTooth={itemForm?.tooth}
        // Bosqich tanlovi faqat xaritadan qoʻshilayotganda: bosqich ichidagi
        // «Ish qoʻshish» dan kelganda u allaqachon maʼlum
        stages={itemForm?.tooth === undefined ? undefined : plan.stages}
        stageId={itemForm?.stageId}
        onSave={(item, stageId) => itemForm && saveItem(stageId ?? itemForm.stageId, item)}
      />
      <BridgeFormDialog
        open={bridgeForm !== null}
        onOpenChange={(open) => !open && setBridgeForm(null)}
        patientId={plan.patientId}
        defaultSpan={bridgeForm?.span}
        onSave={(group, items) => bridgeForm && saveBridge(bridgeForm.stageId, group, items)}
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
