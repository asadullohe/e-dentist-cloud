export interface ToothInfo {
  tooth: number
  status: string
  material?: string | null
  note?: string | null
}

export interface BridgeInfo {
  id: string
  /// Koʻprikka kirgan tishlar, FDI. Oflayn ilovada bu ikkita chegara raqami
  /// edi, bizda esa toʻliq roʻyxat saqlanadi
  teeth: number[]
  material?: string | null
}
