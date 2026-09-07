import { describe, expect, it } from 'vitest'
import { assertTimezone } from './timezone.js'

describe('assertTimezone', () => {
  it('joriy zona mos boʻlsa oʻtkazadi', () => {
    const current = Intl.DateTimeFormat().resolvedOptions().timeZone
    expect(() => assertTimezone(current)).not.toThrow()
  })

  it('mos kelmasa aniq xato beradi — jimgina oʻtib ketmaydi', () => {
    expect(() => assertTimezone('Antarctica/Troll')).toThrow(/Vaqt zonasi notoʻgʻri/)
  })
})
