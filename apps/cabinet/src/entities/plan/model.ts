import type { PLAN_ITEM_STATUS_LABELS, PLAN_STATUS_LABELS } from '@e-dentist/shared'

export type PlanStatus = keyof typeof PLAN_STATUS_LABELS
export type PlanItemStatus = keyof typeof PLAN_ITEM_STATUS_LABELS

export interface PlanItem {
  id: string
  /// Koʻprik guruhi (15.2) — boʻsh boʻlsa oddiy band
  groupId: string | null
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

/// Bandlar guruhi — koʻprik (15.2). Rol shu yerdan: `pontics` ichidagi
/// tish quyma, qolgani tayanch koronka
export interface PlanGroup {
  id: string
  name: string
  teeth: number[]
  pontics: number[]
  material: string | null
}

export interface PlanStage {
  id: string
  name: string
  note: string | null
  total: number
  groups: PlanGroup[]
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
  /// Shu bosqichning `groups` massividagi oʻrin; boʻsh — oddiy band
  groupIndex?: number | null
  tooth?: number | null
  serviceId?: string | null
  treatment: string
  price: number
  qty: number
  note?: string | null
}

export interface PlanGroupDraft {
  id?: string
  name: string
  teeth: number[]
  pontics: number[]
  material?: string | null
}

export interface PlanStageDraft {
  id?: string
  name: string
  note?: string | null
  groups: PlanGroupDraft[]
  items: PlanItemDraft[]
}

/// Ochiq sahifa (/r/<kod>) koʻradigan narsa. Bemorning toʻliq ismi,
/// telefoni va boshqa tashriflari bu yerda yoʻq
export interface PlanPublic {
  clinicName: string
  hasLogo: boolean
  publicPhone: string | null
  address: string | null
  /// «Karimova M. R.»
  patientName: string
  doctorName: string
  title: string
  status: PlanStatus
  validUntil: string | null
  expired: boolean
  total: number
  discount: number
  payable: number
  /// Tish xaritasida belgilanadigan tishlar
  teeth: number[]
  stages: {
    name: string
    note: string | null
    total: number
    /// Koʻprik guruhlari — bandlar `groupId` orqali bogʻlanadi
    groups: { id: string; name: string; teeth: number[]; pontics: number[] }[]
    items: {
      groupId: string | null
      tooth: number | null
      treatment: string
      price: number
      qty: number
      total: number
      done: boolean
    }[]
  }[]
  canRespond: boolean
  /// Bemorda telefon bor — javobda oxirgi 4 raqam soʻraladi
  needsPhone: boolean
}
