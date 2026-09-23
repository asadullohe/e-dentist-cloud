import { PLAN_TEXT, VALIDATION_TEXT } from '@e-dentist/shared'
import { isToothNo } from '@e-dentist/teeth'
import { z } from 'zod'
import { visitCreateSchema } from '../visits/service.js'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/// Narx amal qiladigan sana — kelajakda boʻlishi odatiy hol
const validUntil = z
  .string()
  .trim()
  .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
    error: () => VALIDATION_TEXT.date_invalid,
  })
  .nullish()

const discount = z.coerce
  .number()
  .int()
  .min(0, { error: () => PLAN_TEXT.discount_negative })

const title = z
  .string()
  .trim()
  .min(1, { error: () => PLAN_TEXT.title_required })
  .max(200)

export const planCreateSchema = z.object({
  patientId: z.string().uuid(),
  /// Boʻsh — bemorga biriktirilgan shifokor, u ham boʻlmasa yozayotgan odam
  doctorId: z.string().uuid().nullish(),
  title: title.optional(),
  discount: discount.default(0),
  validUntil,
  note: z.string().trim().max(2000).nullish(),
})

export const planUpdateSchema = z.object({
  title: title.optional(),
  doctorId: z.string().uuid().optional(),
  discount: discount.optional(),
  validUntil,
  note: z.string().trim().max(2000).nullish(),
})

/// Bandning nomi va narxi — snapshot. `serviceId` faqat «qaysi xizmatdan
/// olingan» degan izoh: xizmat keyin oʻchsa ham band joyida qoladi
const itemSchema = z.object({
  /// Boʻsh — yangi band. Bor — mavjudini yangilash
  id: z.string().uuid().optional(),
  tooth: z.coerce
    .number()
    .int()
    .refine(isToothNo, { error: () => PLAN_TEXT.tooth_invalid })
    .nullish(),
  serviceId: z.string().uuid().nullish(),
  treatment: z
    .string()
    .trim()
    .min(1, { error: () => PLAN_TEXT.treatment_required })
    .max(300),
  price: z.coerce
    .number()
    .int()
    .min(0, { error: () => PLAN_TEXT.price_negative }),
  qty: z.coerce
    .number()
    .int()
    .min(1, { error: () => PLAN_TEXT.qty_invalid })
    .max(999)
    .default(1),
  note: z.string().trim().max(500).nullish(),
})

const stageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, { error: () => PLAN_TEXT.stage_name_required })
    .max(200),
  note: z.string().trim().max(1000).nullish(),
  items: z.array(itemSchema).max(200),
})

/// Bosqichlar va bandlar **toʻliq** almashtiriladi: kelgan tartib saqlanadi,
/// kelmagan yozuvlar oʻchiriladi. Tortib tartiblash (dnd) uchun eng qulay
/// shakl — brauzer nimani koʻrsatayotgan boʻlsa, oʻshani yuboradi
export const planContentSchema = z.object({
  stages: z.array(stageSchema).max(50),
})

/// Holat qoʻlda faqat shu toʻrttasiga oʻtadi. `draft` — boshlangʻich,
/// `done` esa oxirgi band bajarilganda oʻzi qoʻyiladi (13.4)
export const planStatusSchema = z.object({
  status: z.enum(['sent', 'accepted', 'declined', 'cancelled']),
  reason: z.string().trim().max(500).nullish(),
})

export const planListSchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'done', 'cancelled']).optional(),
})

/// Band bajarilganda tashrif yoziladi (13.4). Maydonlar `visits` sxemasidan
/// — xato matnlari bir xil boʻlsin; bemor rejadan olinadi
export const planItemCompleteSchema = visitCreateSchema.omit({ patientId: true })

/// Bandni «oʻtkazib yuborildi» ga oʻtkazish va qaytarish
export const planItemSkipSchema = z.object({
  skip: z.boolean().default(true),
})

/// Ochiq sahifadagi javob (/r/<kod>). Bemorda telefon boʻlsa uning oxirgi
/// toʻrt raqami soʻraladi — kod tasodifan boshqa odamga tushsa, u rejani
/// koʻrsa ham javob bera olmaydi
export const planRespondSchema = z.object({
  accept: z.boolean(),
  phoneTail: z
    .string()
    .trim()
    .regex(/^\d{4}$/, { error: () => PLAN_TEXT.phone_wrong })
    .optional(),
  reason: z.string().trim().max(500).nullish(),
})

export type PlanCreateInput = z.infer<typeof planCreateSchema>
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>
export type PlanContentInput = z.infer<typeof planContentSchema>
export type PlanStatusInput = z.infer<typeof planStatusSchema>
export type PlanListInput = z.infer<typeof planListSchema>
export type PlanRespondInput = z.infer<typeof planRespondSchema>
export type PlanItemCompleteInput = z.infer<typeof planItemCompleteSchema>
export type PlanItemSkipInput = z.infer<typeof planItemSkipSchema>
export type PlanStageInput = z.infer<typeof stageSchema>
export type PlanItemInput = z.infer<typeof itemSchema>
