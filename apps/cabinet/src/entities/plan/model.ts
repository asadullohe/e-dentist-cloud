import type { PLAN_ITEM_STATUS_LABELS, PLAN_STATUS_LABELS } from '@e-dentist/shared'

export type PlanStatus = keyof typeof PLAN_STATUS_LABELS
export type PlanItemStatus = keyof typeof PLAN_ITEM_STATUS_LABELS

export interface PlanItem {
  id: string
  /// FDI raqami yoki boʻsh (umumiy ish)
  tooth: number | null
  serviceId: string | null
  treatment: string
  price: number
  qty: number
  /// price × qty
  total: number
  status: PlanItemStatus
  /// Bajarilganda yozilgan tashrif (13.4)
  visitId: string | null
  note: string | null
}

export interface PlanStage {
  id: string
  name: string
  note: string | null
  total: number
  items: PlanItem[]
}

export interface Plan {
  id: string
  patientId: string
  fio: string
  doctorId: string
  doctorName: string
  title: string
  status: PlanStatus
  total: number
  discount: number
  /// total − discount
  payable: number
  itemCount: number
  doneCount: number
  /// YYYY-MM-DD yoki boʻsh
  validUntil: string | null
  expired: boolean
  /// Ochiq sahifa: /r/<kod>
  publicCode: string
  note: string | null
  declineReason: string | null
  cancelReason: string | null
  acceptedAt: string | null
  createdAt: string
  stages: PlanStage[]
}

/// Serverga yuboriladigan mazmun: bosqichlar va bandlar **birgalikda**.
/// `id` boʻlmasa — yangi yozuv, kelmagani oʻchadi
export interface PlanItemDraft {
  id?: string
  tooth?: number | null
  serviceId?: string | null
  treatment: string
  price: number
  qty: number
  note?: string | null
}

export interface PlanStageDraft {
  id?: string
  name: string
  note?: string | null
  items: PlanItemDraft[]
}
