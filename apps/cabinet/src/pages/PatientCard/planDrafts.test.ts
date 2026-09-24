import { describe, expect, it } from 'vitest'
import type { Plan, PlanGroupDraft, PlanItemDraft, PlanStage } from '@/entities/plan'
import { dropGroup, orderBlocks, putBridge, toBlocks, toDrafts } from './planDrafts'

function item(
  id: string,
  groupId: string | null,
  tooth: number | null,
): PlanStage['items'][number] {
  return {
    id,
    groupId,
    tooth,
    serviceId: null,
    treatment: `Ish ${id}`,
    price: 100,
    qty: 1,
    total: 100,
    status: 'pending',
    visitId: null,
    note: null,
  }
}

function group(id: string, teeth: number[]): PlanStage['groups'][number] {
  return { id, name: `Koʻprik ${id}`, teeth, pontics: [], material: null }
}

/// Bitta bosqichli reja — sof funksiyalarni sinash uchun shu yetadi
function planOf(stage: Partial<PlanStage>): Plan {
  return {
    id: 'plan',
    patientId: 'patient',
    fio: '',
    doctorId: '',
    doctorName: '',
    title: 'Reja',
    status: 'draft',
    total: 0,
    discount: 0,
    payable: 0,
    itemCount: 0,
    doneCount: 0,
    validUntil: null,
    expired: false,
    publicCode: '',
    note: null,
    declineReason: null,
    cancelReason: null,
    acceptedAt: null,
    createdAt: '',
    stages: [{ id: 's1', name: 'Bosqich', note: null, total: 0, groups: [], items: [], ...stage }],
  }
}

describe('toBlocks — koʻrinadigan birliklar', () => {
  it('guruh bandlari bitta blok, yakka bandlar alohida', () => {
    const blocks = toBlocks({
      id: 's1',
      name: 'Bosqich',
      note: null,
      total: 0,
      groups: [group('g1', [47, 46, 45])],
      items: [item('a', null, 16), item('b', 'g1', 47), item('c', 'g1', 46), item('d', null, 36)],
    })

    expect(blocks.map((block) => block.kind)).toEqual(['item', 'group', 'item'])
    const bridge = blocks[1]
    expect(bridge?.kind === 'group' && bridge.items.map((row) => row.id)).toEqual(['b', 'c'])
  })

  it('guruhi oʻchirilgan band yakka qoladi', () => {
    const blocks = toBlocks({
      id: 's1',
      name: 'Bosqich',
      note: null,
      total: 0,
      groups: [],
      items: [item('a', 'yoʻq-guruh', 47)],
    })
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.kind).toBe('item')
  })
})

describe('putBridge — koʻprik qoʻshish', () => {
  it('bandlar yangi guruhning indeksiga bogʻlanadi', () => {
    const draft: PlanGroupDraft = { name: 'Koʻprik', teeth: [47, 46, 45], pontics: [46] }
    const items: PlanItemDraft[] = [47, 46, 45].map((tooth) => ({
      tooth,
      treatment: 'Koronka',
      price: 900_000,
      qty: 1,
    }))

    const [stage] = putBridge(
      's1',
      draft,
      items,
    )(toDrafts(planOf({ items: [item('a', null, 16)] })))

    expect(stage?.groups).toHaveLength(1)
    // Mavjud band tegilmaydi, yangilari 0-guruhga
    expect(stage?.items.map((row) => row.groupIndex)).toEqual([null, 0, 0, 0])
  })
})

describe('dropGroup — guruhni oʻchirish', () => {
  it('guruh bandlari ketadi, keyingi guruhlarning indeksi suriladi', () => {
    const plan = planOf({
      groups: [group('g1', [47, 46]), group('g2', [37, 36])],
      items: [
        item('a', 'g1', 47),
        item('b', 'g1', 46),
        item('c', null, 16),
        item('d', 'g2', 37),
        item('e', 'g2', 36),
      ],
    })

    const [stage] = dropGroup('s1', 0)(toDrafts(plan))

    expect(stage?.groups.map((row) => row.id)).toEqual(['g2'])
    expect(stage?.items.map((row) => row.id)).toEqual(['c', 'd', 'e'])
    // g2 endi 0-oʻrinda — bandlari ham shunga koʻchadi
    expect(stage?.items.map((row) => row.groupIndex)).toEqual([null, 0, 0])
  })
})

describe('orderBlocks — blok tartibi', () => {
  it('guruh bandlari birga koʻchadi', () => {
    const plan = planOf({
      groups: [group('g1', [47, 46])],
      items: [item('a', null, 16), item('b', 'g1', 47), item('c', 'g1', 46), item('d', null, 36)],
    })

    // Koʻprik roʻyxat boshiga tortildi
    const [stage] = orderBlocks('s1', ['g1', 'a', 'd'], ['g1'])(toDrafts(plan))

    expect(stage?.items.map((row) => row.id)).toEqual(['b', 'c', 'a', 'd'])
  })
})
