// Ruscha matnlar.
//
// Tuzilma `uz.ts` bilan bir xil: `Strings` tipi kalitlarni tekshiradi,
// notoʻgʻri yozilgan kalit yoki notoʻgʻri funksiya imzosi kompilyatsiyada
// yiqiladi. Tarjima qilinmagan kalit oʻzbekchaga qaytadi — shuning uchun
// boʻlaklab toʻldirish mumkin.
//
// Tarjima qoidalari: pul soʻmda, sana DD/MM/YYYY — format oʻzgarmaydi.

import type { DeepPartial, Strings } from '../strings.js'

export const ru: DeepPartial<Strings> = {
  // Namuna: til almashishi ishlayotganini koʻrsatish uchun. Toʻliq tarjima
  // alohida task (reja 7.7)
  UI_TEXT: {
    login: 'Войти',
    logout: 'Выйти',
    menu: 'Меню',
    language: 'Язык',
    theme_light: 'Светлая тема',
    theme_dark: 'Тёмная тема',
    loading: 'Загрузка…',
  },
}
