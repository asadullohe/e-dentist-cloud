// Xat yuborish.
//
// Lokalda xat konsolga chiqadi — SMTP sozlash ishlab chiqishni sekinlashtiradi
// va roʻyxatdan oʻtishni sinash uchun kerak emas. Haqiqiy SMTP bosqich 5 da.

export interface Mail {
  to: string
  subject: string
  body: string
}

export interface Mailer {
  send(mail: Mail): Promise<void>
}

/// Konsolga yozadi. Havolani terminaldan nusxalab olib, brauzerda ochish mumkin
export function consoleMailer(log: (message: string) => void): Mailer {
  return {
    async send(mail) {
      log(
        [
          '',
          '─────────── XAT (lokal, hech qayerga yuborilmadi) ───────────',
          `Kimga:  ${mail.to}`,
          `Mavzu:  ${mail.subject}`,
          '',
          mail.body,
          '─────────────────────────────────────────────────────────────',
          '',
        ].join('\n'),
      )
    },
  }
}

/// Testlarda: yuborilgan xatlarni yigʻib turadi
export function memoryMailer(): Mailer & { sent: Mail[] } {
  const sent: Mail[] = []
  return {
    sent,
    async send(mail) {
      sent.push(mail)
    },
  }
}
