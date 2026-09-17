import { useLayoutEffect } from 'react'

// Yuklanish ekranining oʻzi index.html da (statik HTML + CSS): HTML kelishi
// bilan koʻrinadi, JS va React ni kutmaydi — my.adliya.uz kabi. Bu yerda
// faqat boshqaruv: <Splash/> chizilib turgan ekan, ekran ochiq qoladi;
// oxirgisi yoʻqolganda yopiladi. Belgi ikki joyda takrorlanmaydi va
// almashinuvda animatsiya sakramaydi.

/// Nom chizilib boʻlguncha (index.html: oxirgi harf ~2 s) ekran yopilmaydi —
/// sessiya tezroq kelsa ham brend toʻliq koʻrinadi. Sahifa ochilgan
/// lahzadan sanaladi, React chizilganidan emas
const MIN_VISIBLE_MS = 2300

/// Hozir nechta <Splash/> ushlab turibdi
let holders = 0
let hideTimer: number | undefined

function element(): HTMLElement | null {
  return document.getElementById('splash')
}

function hide(): void {
  window.clearTimeout(hideTimer)
  const wait = MIN_VISIBLE_MS - performance.now()
  if (wait <= 0) {
    element()?.setAttribute('hidden', '')
    return
  }
  hideTimer = window.setTimeout(() => {
    if (holders === 0) element()?.setAttribute('hidden', '')
  }, wait)
}

/// React birinchi marta chizilgach App chaqiradi: hech kim ushlab turmagan
/// boʻlsa (masalan kirish sahifasi ochildi) statik ekran yopiladi
export function dismissStaticSplash(): void {
  if (holders === 0) hide()
}

/// Sessiya kelguncha va shunga oʻxshash «hali hech narsa yoʻq» holatlarda.
/// Oʻzi hech narsa chizmaydi — index.html dagi ekranni ochiq tutadi
export function Splash() {
  // useLayoutEffect: bolaning effekti otanikidan oldin ishlaydi — App dagi
  // dismissStaticSplash chaqirilganda hisob allaqachon 1 boʻladi
  useLayoutEffect(() => {
    holders++
    window.clearTimeout(hideTimer)
    element()?.removeAttribute('hidden')
    return () => {
      holders--
      if (holders === 0) hide()
    }
  }, [])

  return null
}
