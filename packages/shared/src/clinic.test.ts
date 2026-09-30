import { describe, expect, it } from 'vitest'
import { clinicNameError, resolveClinicName } from './clinic.js'

describe('roʻyxatdagi nom', () => {
  it('klinikada nom majburiy', () => {
    expect(clinicNameError('clinic', '  ')).not.toBeNull()
    expect(clinicNameError('clinic', 'Tabassum')).toBeNull()
  })

  it('individualda boʻsh nom — shifokorning ismi', () => {
    expect(clinicNameError('solo', '')).toBeNull()
    expect(resolveClinicName('solo', '  ', ' Karimov Aziz ')).toBe('Dr. Karimov Aziz')
  })

  it('individualda yozilgan nom saqlanadi, lekin juda qisqasi rad', () => {
    expect(resolveClinicName('solo', ' Oq tish ', 'Karimov Aziz')).toBe('Oq tish')
    expect(clinicNameError('solo', 'A')).not.toBeNull()
  })
})
