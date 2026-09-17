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

/// React birinchi marta chizilgach App chaqiradi: hech kim ushlab turmagan
/// boʻlsa (masalan kirish sahifasi ochildi) statik ekran yopiladi
export function dismissStaticSplash(): void {
  if (holders === 0) element()?.setAttribute('hidden', '')
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
      if (holders === 0) element()?.setAttribute('hidden', '')
    }
  }, [])

  return null
}
