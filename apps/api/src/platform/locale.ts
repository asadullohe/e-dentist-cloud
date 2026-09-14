// Soʻrov tili. Har soʻrov `Accept-Language` ga qarab oʻz tilida javob
// oladi: xato matnlari, xat, Excel sarlavhalari.
//
// `@e-dentist/shared` dagi jonli eksportlar (`AUTH_TEXT.x`) tilni
// `getLocale()` dan oʻqiydi. Serverda bitta global til boʻlmaydi — ikki
// soʻrov bir vaqtda turli tilda kelishi mumkin. Shuning uchun til
// AsyncLocalStorage da saqlanadi va shared unga resolver orqali qaraydi.

import { AsyncLocalStorage } from 'node:async_hooks'
import { type Locale, parseAcceptLanguage, setLocaleResolver } from '@e-dentist/shared'
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'

const store = new AsyncLocalStorage<Locale>()

setLocaleResolver(() => store.getStore())

/// `onRequest` ilgagi: qolgan butun sikl (validatsiya, xizmat, javob) shu
/// til kontekstida ishlaydi. `done` ni `run` ichida chaqirish shart —
/// Fastify keyingi qadamni aynan shu chaqiruv ichida boshlaydi
export function localeHook(
  req: FastifyRequest,
  _reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  store.run(parseAcceptLanguage(req.headers['accept-language']), done)
}

/// Soʻrovdan tashqarida (fon ishlari, testlar) aniq tilda bajarish
export function withLocale<T>(locale: Locale, fn: () => T): T {
  return store.run(locale, fn)
}

/// Joriy soʻrov tili — masalan, fon ishiga uzatish uchun
export function requestLocale(): Locale | undefined {
  return store.getStore()
}
