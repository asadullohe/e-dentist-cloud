// Bir martalik («oʻz-oʻzini yoʻq qiladigan») pochta xizmatlari.
//
// Roʻyxatdan oʻtish ochiq boʻlgani uchun kerak: bunday manzil bilan cheksiz
// sinov hisobi ochish mumkin. Roʻyxat toʻliq boʻlishi shart emas — u eng
// koʻp uchraydiganlarni toʻsadi, qolganini IP cheklovi ushlaydi.

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.net',
  'sharklasers.com',
  'mailinator.com',
  'temp-mail.org',
  'tempmail.com',
  'tempmailo.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'maildrop.cc',
  'mohmal.com',
  'emailondeck.com',
  'moakt.com',
  'tempr.email',
  'discard.email',
  'spambog.com',
  'mytemp.email',
  'burnermail.io',
  'inboxkitten.com',
  'harakirimail.com',
  'mail-temp.com',
  'tmail.ws',
  'minuteinbox.com',
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1]
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false
}
