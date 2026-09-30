// Klinika nomi roʻyxatdan oʻtishda (tz.md 20-boʻlim). Server ham, kabinet
// ham shu qoidani ishlatadi — ekranda koʻrsatilgan nom bazaga yoziladiganidan
// farq qilmasin

import { AUTH_TEXT } from './strings.js'
import type { ClinicKind } from './types.js'

const MIN_NAME = 2

/// Individual shifokor nom yozmasa — oʻz ismi bilan. Yakka stomatologlarning
/// koʻpi shunday ishlaydi, nom soʻrash esa roʻyxatni toʻxtatadi
export function defaultCabinetName(fullName: string): string {
  return `Dr. ${fullName.trim()}`
}

/// Bazaga yoziladigan nom
export function resolveClinicName(kind: ClinicKind, clinicName: string, fullName: string): string {
  const name = clinicName.trim()
  return kind === 'solo' && !name ? defaultCabinetName(fullName) : name
}

/// Klinikada nom majburiy; individualda ixtiyoriy, lekin yozilsa — toʻliq
export function clinicNameError(kind: ClinicKind, clinicName: string): string | null {
  const name = clinicName.trim()
  if (kind === 'solo') {
    return name && name.length < MIN_NAME ? AUTH_TEXT.cabinet_name_too_short : null
  }
  return name.length < MIN_NAME ? AUTH_TEXT.clinic_name_too_short : null
}
