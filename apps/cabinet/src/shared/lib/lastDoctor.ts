// Assistent oxirgi tanlagan shifokor (tz.md 20-boʻlim): yangi bemor va
// qabulda sukut shu boʻladi — bir nechta shifokorga yordam bersa ham,
// odatda ketma-ket bittasi bilan ishlaydi.
// `localStorage` yopiq boʻlishi mumkin (maxfiy oyna) — unda sukut yoʻq

const KEY = 'edentist-cabinet-last-doctor'

export function readLastDoctor(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    // saqlash oʻchirilgan — sukutsiz ishlaydi
    return null
  }
}

export function saveLastDoctor(doctorId: string): void {
  try {
    localStorage.setItem(KEY, doctorId)
  } catch {
    // saqlanmasa ham forma ishlaydi
  }
}
