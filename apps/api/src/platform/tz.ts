// Vaqt zonasi. Konteyner sukut boʻyicha UTC da ishlaydi — Toshkentdan 5 soat
// orqada. Buni tuzatmasak, kechqurun soat 19:00 dan keyin server «bugun» deb
// kechagi sanani qaytaradi: qabullar notoʻgʻri kunga tushadi, kunlik hisobot
// buziladi. Xato jimgina yuz beradi, shuning uchun ishga tushishda tekshiramiz.
//
// TZ ni kod ichida oʻrnatib boʻlmaydi: ESM da importlar modul tanasidagi
// koddan oldin bajariladi. Shuning uchun u muhitdan keladi (.env, compose),
// bu yerda esa faqat tasdiqlanadi.

export function tekshirVaqtZonasi(kutilgan: string): void {
  const joriy = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (joriy === kutilgan) return
  throw new Error(
    `Vaqt zonasi notoʻgʻri: «${joriy}», kutilgani «${kutilgan}». ` +
      `TZ muhit oʻzgaruvchisini «${kutilgan}» qilib qoʻying, aks holda sanalar surilib ketadi.`,
  )
}
