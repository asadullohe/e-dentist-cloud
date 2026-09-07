// Xat yuborish.
//
// Lokalda xat konsolga chiqadi — SMTP sozlash ishlab chiqishni sekinlashtiradi
// va roʻyxatdan oʻtishni sinash uchun kerak emas. Haqiqiy SMTP bosqich 5 da.

export interface Xat {
  kimga: string
  mavzu: string
  matn: string
}

export interface PochtaYuboruvchi {
  yubor(xat: Xat): Promise<void>
}

/// Konsolga yozadi. Havolani terminaldan nusxalab olib, brauzerda ochish mumkin
export function konsolPochtasi(log: (xabar: string) => void): PochtaYuboruvchi {
  return {
    async yubor(xat) {
      log(
        [
          '',
          '─────────── XAT (lokal, hech qayerga yuborilmadi) ───────────',
          `Kimga:  ${xat.kimga}`,
          `Mavzu:  ${xat.mavzu}`,
          '',
          xat.matn,
          '─────────────────────────────────────────────────────────────',
          '',
        ].join('\n'),
      )
    },
  }
}

/// Testlarda: yuborilgan xatlarni yigʻib turadi
export function xotiraPochtasi(): PochtaYuboruvchi & { xatlar: Xat[] } {
  const xatlar: Xat[] = []
  return {
    xatlar,
    async yubor(xat) {
      xatlar.push(xat)
    },
  }
}
