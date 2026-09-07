import { describe, expect, it } from 'vitest'
import { tekshirVaqtZonasi } from './tz.js'

describe('tekshirVaqtZonasi', () => {
  it('joriy zona mos boʻlsa oʻtkazadi', () => {
    const joriy = Intl.DateTimeFormat().resolvedOptions().timeZone
    expect(() => tekshirVaqtZonasi(joriy)).not.toThrow()
  })

  it('mos kelmasa aniq xato beradi — jimgina oʻtib ketmaydi', () => {
    expect(() => tekshirVaqtZonasi('Antarctica/Troll')).toThrow(/Vaqt zonasi notoʻgʻri/)
  })
})
