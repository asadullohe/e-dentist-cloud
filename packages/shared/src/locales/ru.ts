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
  // Server javoblari: umumiy xatolar, forma tekshiruvi, Excel sarlavhalari.
  // Qolgan toʻplamlar — alohida task (reja 7.7)
  ERROR_TEXT: {
    bad_request: 'Неверный запрос',
    unauthorized: 'Сначала войдите в систему',
    forbidden: 'У вас нет прав на это действие',
    not_found: 'Не найдено',
    conflict: 'Такая запись уже есть',
    validation: 'В введённых данных есть ошибка',
    rate_limited: 'Слишком много попыток. Подождите немного и попробуйте снова',
    subscription_expired: 'Срок подписки истёк. Данные видны, но добавить новую запись нельзя',
    internal: 'Произошла непредвиденная ошибка. Попробуйте позже',
  },
  VALIDATION_TEXT: {
    fio_required: 'Укажите Ф.И.О.',
    fio_too_short: 'Введите не менее 3 букв',
    fio_letters_only: 'В имени могут быть только буквы',
    phone_incomplete: 'Номер неполный: +998 XX XXX XX XX',
    date_invalid: 'Неверная дата',
    date_in_future: 'Дата не может быть в будущем',
    date_too_old: 'Слишком давняя дата',
  },
  PATIENT_TEXT: {
    not_found: 'Пациент не найден',
  },
  PATIENT_EXCEL_COLUMNS: {
    id: 'ID',
    fio: 'Ф.И.О.',
    phone: 'Телефон',
    birthDate: 'Дата рождения',
    address: 'Адрес',
    note: 'Примечание',
  },
  UI_TEXT: {
    login: 'Войти',
    logout: 'Выйти',
    menu: 'Меню',
    language: 'Язык',
    theme_light: 'Светлая тема',
    theme_dark: 'Тёмная тема',
    date_placeholder: 'ДД/ММ/ГГГГ',
    pick_date: 'Выбрать в календаре',
    loading: 'Загрузка…',
  },
}
