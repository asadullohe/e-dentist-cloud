import type {
  LAB_MATERIAL_LABELS,
  LAB_RETURN_REASON_LABELS,
  LAB_STATUS_LABELS,
  LAB_WORK_TYPE_LABELS,
} from '@e-dentist/shared'

export type LabWorkType = keyof typeof LAB_WORK_TYPE_LABELS
export type LabMaterial = keyof typeof LAB_MATERIAL_LABELS
export type LabStatus = keyof typeof LAB_STATUS_LABELS
export type LabReturnReason = keyof typeof LAB_RETURN_REASON_LABELS

export interface LabOrder {
  id: string
  patientId: string
  fio: string
  doctorId: string
  doctorName: string
  techId: string | null
  techName: string | null
  /// Tashqi laboratoriya — texnik oʻrniga (tz.md 20-boʻlim)
  labId: string | null
  labName: string | null
  teeth: number[]
  workType: LabWorkType
  material: LabMaterial
  shade: string | null
  /// YYYY-MM-DD
  dueDate: string
  status: LabStatus
  note: string | null
  returns: number
  returnReason: LabReturnReason | null
  returnNote: string | null
  overdue: boolean
  /// `lab.cost` yoki oʻz naryadi boʻlmasa javobda kelmaydi
  techPrice?: number
}

/// Klinikaning tashqi laboratoriyasi
export interface LabPlace {
  id: string
  name: string
  phone: string | null
}

export interface LabFilter {
  status?: LabStatus
  techId?: string
  patientId?: string
}
