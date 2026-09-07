// Serverdan kelgan maydon xatolarini formaga koʻchiradi.
//
// Server tekshiruvi mijoznikidan kengroq: takrorlangan pochta, urinishlar
// cheklovi va h.k. faqat u yerda maʼlum boʻladi.

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { fieldErrors, formError } from '@/shared/api'

/// Maydonlarga tegishli xatolarni formaga qoʻyadi va formaning umumiy
/// xatosini qaytaradi (maydonga bogʻlanmagan xato boʻlsa)
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): string {
  for (const [name, message] of Object.entries(fieldErrors(error))) {
    form.setError(name as Path<T>, { message })
  }
  return formError(error)
}
