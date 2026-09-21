import type { z } from 'zod'
import { periodSchema } from '../../platform/period.js'

/// Davr (`month` yoki `from`/`to`): jamlanma shu davr uchun, grafik esa
/// davr oxiri tushgan oy bilan tugaydigan 12 oy
export const reportSchema = periodSchema

export type ReportInput = z.infer<typeof reportSchema>
