// Xat yuborish.
//
// Lokalda xat konsolga chiqadi — SMTP sozlash ishlab chiqishni sekinlashtiradi
// va roʻyxatdan oʻtishni sinash uchun kerak emas. Serverda esa haqiqiy SMTP
// boʻlishi shart: xatsiz hech kim roʻyxatdan oʻta olmaydi, chunki kabinet
// pochta tasdigʻisiz ochilmaydi. Shuning uchun prod da SMTP boʻlmasa
// server umuman koʻtarilmaydi (platform/config.ts).

import { createTransport } from 'nodemailer'

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

export interface SmtpSettings {
  host: string
  port: number
  user: string
  password: string
  /// Xat kimdan kelgani koʻrinadi: «E-Dentist <bot@e-dentist.uz>»
  from: string
}

/// Haqiqiy SMTP. Ulanish bir marta ochiladi va qayta ishlatiladi
export function smtpMailer(settings: SmtpSettings): Mailer {
  const transport = createTransport({
    host: settings.host,
    port: settings.port,
    // 465 — implicit TLS; qolganlarida STARTTLS
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.password },
  })

  return {
    async send(mail) {
      await transport.sendMail({
        from: settings.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.body,
      })
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
