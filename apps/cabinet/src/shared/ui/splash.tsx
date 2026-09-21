import { useLayoutEffect } from 'react'

// Yuklanish ekranining oʻzi index.html da (statik HTML + CSS): HTML kelishi
// bilan koʻrinadi, JS va React ni kutmaydi — my.adliya.uz kabi. Bu yerda
// faqat boshqaruv: <Splash/> chizilib turgan ekan, ekran ochiq qoladi;
// oxirgisi yoʻqolganda yopiladi. Belgi ikki joyda takrorlanmaydi va
// almashinuvda animatsiya sakramaydi.

/// Hozir nechta <Splash/> ushlab turibdi
let holders = 0

function element(): HTMLElement | null {
  return document.getElementById('splash')
}

/// Ilova tayyor boʻlishi bilan yopiladi — animatsiya tugashini kutmaydi:
/// foydalanuvchi ishga kirmoqchi, tomosha qilmoqchi emas
function hide(): void {
  element()?.setAttribute('hidden', '')
}

/// React birinchi marta chizilgach App chaqiradi: hech kim ushlab turmagan
/// boʻlsa (masalan kirish sahifasi ochildi) statik ekran yopiladi
export function dismissStaticSplash(): void {
  if (holders === 0) hide()
}

/// Ilova xato bilan yiqilganda: kim ushlab turganidan qatʼi nazar yopiladi —
/// xato ekrani yuklanish ekrani ostida qolib ketmasin
export function hideStaticSplash(): void {
  holders = 0
  hide()
}

/// Sessiya kelguncha va shunga oʻxshash «hali hech narsa yoʻq» holatlarda.
/// Oʻzi hech narsa chizmaydi — index.html dagi ekranni ochiq tutadi
export function Splash() {
  // useLayoutEffect: bolaning effekti otanikidan oldin ishlaydi — App dagi
  // dismissStaticSplash chaqirilganda hisob allaqachon 1 boʻladi
  useLayoutEffect(() => {
    holders++
    element()?.removeAttribute('hidden')
    return () => {
      holders--
      if (holders === 0) hide()
    }
  }, [])

  return null
}
