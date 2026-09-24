// Reja mazmunini oʻzgartirish — sof funksiyalar. Serverga mazmun
// **butunligicha** yuboriladi (PUT /plans/:id/content), shuning uchun har
// amal joriy holatdan nusxa olib, oʻzgartirilgan nusxani qaytaradi.

import type {
  Plan,
  PlanGroup,
  PlanGroupDraft,
  PlanItem,
  PlanItemDraft,
  PlanStage,
  PlanStageDraft,
} from '@/entities/plan'

export function toDrafts(plan: Plan): PlanStageDraft[] {
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
export type Block =
  | { kind: 'group'; id: string; group: PlanGroup; items: PlanItem[] }
  | { kind: 'item'; id: string; item: PlanItem }

export function toBlocks(stage: PlanStage): Block[] {
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

type Change = (drafts: PlanStageDraft[]) => PlanStageDraft[]

const inStage =
  (stageId: string, change: (stage: PlanStageDraft) => PlanStageDraft): Change =>
  (drafts) =>
    drafts.map((stage) => (stage.id === stageId ? change(stage) : stage))

export const putStage = (stage: Pick<PlanStageDraft, 'id' | 'name' | 'note'>): Change =>
  stage.id
    ? (drafts) =>
        drafts.map((row) =>
          row.id === stage.id ? { ...row, name: stage.name, note: stage.note } : row,
        )
    : (drafts) => [...drafts, { ...stage, groups: [], items: [] }]

export const putItem = (stageId: string, item: PlanItemDraft): Change =>
  inStage(stageId, (stage) => ({
    ...stage,
    items: item.id
      ? stage.items.map((old) => (old.id === item.id ? item : old))
      : [...stage.items, item],
  }))

export const dropItem = (stageId: string, itemId: string): Change =>
  inStage(stageId, (stage) => ({
    ...stage,
    items: stage.items.filter((item) => item.id !== itemId),
  }))

export const dropStage =
  (stageId: string): Change =>
  (drafts) =>
    drafts.filter((stage) => stage.id !== stageId)

export const orderStages =
  (ids: readonly string[]): Change =>
  (drafts) => {
    const byId = new Map(drafts.map((stage) => [stage.id as string, stage]))
    return ids.flatMap((id) => byId.get(id) ?? [])
  }

/// Koʻprik: guruh va oraliqdagi har tish uchun bitta band birga qoʻshiladi
export const putBridge = (
  stageId: string,
  group: PlanGroupDraft,
  items: readonly PlanItemDraft[],
): Change =>
  inStage(stageId, (stage) => {
    const groupIndex = stage.groups.length
    return {
      ...stage,
      groups: [...stage.groups, group],
      items: [...stage.items, ...items.map((item) => ({ ...item, groupIndex }))],
    }
  })

/// Koʻprikni oʻchirish — guruh ham, ichidagi bandlar ham. Bajarilgan band
/// boʻlsa server rad etadi. `index` — bosqichning `groups` massividagi oʻrin
export const dropGroup = (stageId: string, index: number): Change =>
  inStage(stageId, (stage) => ({
    ...stage,
    groups: stage.groups.filter((_, at) => at !== index),
    items: stage.items
      .filter((item) => item.groupIndex !== index)
      // Qolgan guruhlarning indekslari surildi
      .map((item) => ({
        ...item,
        groupIndex:
          item.groupIndex == null || item.groupIndex < index
            ? item.groupIndex
            : item.groupIndex - 1,
      })),
  }))

/// Tortilgani — blok (guruh yoki yakka band). Guruh bandlari ketma-ket
/// turadi, shuning uchun tartib bloklar boʻyicha qayta yigʻiladi.
/// `groupIds` — bosqichning guruhlari kelgan tartibda (indeksdan idga)
export const orderBlocks = (
  stageId: string,
  ids: readonly string[],
  groupIds: readonly string[],
): Change =>
  inStage(stageId, (stage) => {
    const byBlock = new Map<string, PlanItemDraft[]>()
    for (const item of stage.items) {
      const key =
        item.groupIndex == null
          ? (item.id as string)
          : (groupIds[item.groupIndex] ?? (item.id as string))
      byBlock.set(key, [...(byBlock.get(key) ?? []), item])
    }
    return { ...stage, items: ids.flatMap((id) => byBlock.get(id) ?? []) }
  })
