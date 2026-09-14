// Soʻrov tili (7.6). Har soʻrov `Accept-Language` ga qarab oʻz tilida
// javob oladi; parallel soʻrovlar bir-birining tilini buzmaydi.

import { strings } from '@e-dentist/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Harness, startHarness } from '../test-support/harness.js'
import { sheetRows } from '../test-support/sheets.js'

let h: Harness

beforeAll(async () => {
  h = await startHarness()
}, 30_000)

afterAll(async () => {
  await h.stop()
})

/// Juda qisqa F.I.O. — forma xatosi kafolatlangan
const shortPatient = (language?: string) =>
  h.app.inject({
    method: 'POST',
    url: '/api/patients',
    headers: { cookie: h.cookie, ...(language ? { 'accept-language': language } : {}) },
    payload: { fio: 'A' },
  })

const uzText = strings('uz').VALIDATION_TEXT.fio_too_short
const ruText = strings('ru').VALIDATION_TEXT.fio_too_short

describe('forma xatolari', () => {
  it('sarlavha boʻlmasa — oʻzbekcha', async () => {
    const r = await shortPatient()
    expect(r.statusCode).toBe(400)
    expect(r.json().error.fields.fio).toBe(uzText)
  })

  it('Accept-Language: ru — ruscha', async () => {
    expect(ruText).not.toBe(uzText)
    const r = await shortPatient('ru-RU,ru;q=0.9,en;q=0.8')
    expect(r.json().error.fields.fio).toBe(ruText)
    expect(r.json().error.message).toBe(strings('ru').ERROR_TEXT.validation)
  })

  it('qoʻllab-quvvatlanmagan til — oʻzbekcha', async () => {
    const r = await shortPatient('en-US,en;q=0.9')
    expect(r.json().error.fields.fio).toBe(uzText)
  })

  // Til AsyncLocalStorage da: global oʻzgaruvchi boʻlsa parallel soʻrovlar
  // bir-birining tilini oʻzgartirib yuborardi
  it('parallel soʻrovlar har biri oʻz tilida', async () => {
    const languages = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 'ru' : 'uz'))
    const responses = await Promise.all(languages.map((language) => shortPatient(language)))
    responses.forEach((r, i) => {
      expect(r.json().error.fields.fio).toBe(languages[i] === 'ru' ? ruText : uzText)
    })
  })
})

describe('umumiy xatolar', () => {
  it('404 ham soʻrov tilida', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/00000000-0000-4000-8000-000000000000',
      headers: { cookie: h.cookie, 'accept-language': 'ru' },
    })
    expect(r.statusCode).toBe(404)
    expect(r.json().error.message).toBe(strings('ru').PATIENT_TEXT.not_found)
  })

  it('loginsiz 401 ham soʻrov tilida', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients',
      headers: { 'accept-language': 'ru' },
    })
    expect(r.statusCode).toBe(401)
    expect(r.json().error.message).toBe(strings('ru').ERROR_TEXT.unauthorized)
  })
})

describe('Excel', () => {
  it('shablon sarlavhalari soʻrov tilida', async () => {
    const r = await h.app.inject({
      method: 'GET',
      url: '/api/patients/import/template',
      headers: { cookie: h.cookie, 'accept-language': 'ru' },
    })
    expect(r.statusCode).toBe(200)
    const rows = await sheetRows(r.rawPayload)
    const columns = strings('ru').PATIENT_EXCEL_COLUMNS
    expect(rows[0]).toEqual([
      columns.id,
      columns.fio,
      columns.phone,
      columns.birthDate,
      columns.address,
      columns.note,
    ])
  })
})
