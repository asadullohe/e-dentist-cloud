// Telegram xabarnomasi: yangi klinika roʻyxatdan oʻtganda platforma
// egasiga xabar keladi (tz.md 11-boʻlim).
//
// Xabar yuborish hech qachon asosiy amalni buzmaydi: Telegram yotgan
// boʻlsa ham roʻyxatdan oʻtish davom etadi — xato faqat logga tushadi.

export interface Notifier {
  send(text: string): Promise<void>
}

/// Sozlanmagan boʻlsa hech narsa qilmaydi. Lokalda odatdagi holat
export function silentNotifier(): Notifier {
  return { async send() {} }
}

export interface TelegramSettings {
  token: string
  chatId: string
  log: (message: string, meta?: Record<string, unknown>) => void
}

export function telegramNotifier(settings: TelegramSettings): Notifier {
  return {
    async send(text) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${settings.token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.chatId,
            text,
            disable_web_page_preview: true,
          }),
        })
        if (!response.ok) {
          settings.log('telegram xabari yuborilmadi', { status: response.status })
        }
      } catch (error) {
        // Tarmoq xatosi roʻyxatdan oʻtishni toʻxtatmaydi
        settings.log('telegram bilan aloqa yoʻq', { error: String(error) })
      }
    },
  }
}

/// Testlarda: yuborilgan xabarlarni yigʻib turadi
export function memoryNotifier(): Notifier & { sent: string[] } {
  const sent: string[] = []
  return {
    sent,
    async send(text) {
      sent.push(text)
    },
  }
}
