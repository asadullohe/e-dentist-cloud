/// Navbat raqamiga fikr berilgani brauzerda eslab qolinadi — raqam kartasi
/// yulduzlarni qayta koʻrsatmaydi. Server baribir ikkinchisini rad etadi
const key = (ticketId: string) => `ed_feedback_${ticketId}`

export function feedbackGiven(ticketId: string): boolean {
  try {
    return localStorage.getItem(key(ticketId)) !== null
  } catch {
    // Shaxsiy rejimda localStorage yopiq boʻlishi mumkin — sahifa baribir ishlaydi
    return false
  }
}

export function rememberFeedback(ticketId: string): void {
  try {
    localStorage.setItem(key(ticketId), '1')
  } catch {
    // Saqlab boʻlmasa ham fikr yuborilgan — server biladi
  }
}
