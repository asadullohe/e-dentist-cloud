// Tish siluetlari. Lokal koordinatada: toj tepada, ildiz pastda.
// Oflayn ilovadagi ToothChart.jsx dan koʻchirildi.

import type { ToothType } from '@e-dentist/teeth'

export const SHAPES: Record<ToothType, string> = {
  // Kesuvchi: keng tekis qirra + bitta ingichka ildiz
  incisor:
    'M -12 -36 L 12 -36 C 14 -22 14 -10 11 -1 C 9 5 7 9 5 11 C 4 21 2 34 0 34 C -2 34 -4 21 -5 11 C -7 9 -9 5 -11 -1 C -14 -10 -14 -22 -12 -36 Z',
  // Qoziq tish: oʻtkir uchli toj
  canine:
    'M 0 -40 C 6 -34 11 -26 12 -16 C 13 -6 12 2 9 8 C 7 11 5 12 4 14 C 3 24 1 35 0 35 C -1 35 -3 24 -4 14 C -5 12 -7 11 -9 8 C -12 2 -13 -6 -12 -16 C -11 -26 -6 -34 0 -40 Z',
  // Kichik oziq: ikki doʻngli toj, bitta ildiz
  premolar:
    'M -14 -30 C -10 -37 -4 -37 0 -32 C 4 -37 10 -37 14 -30 C 16 -22 16 -10 13 -2 C 11 4 8 8 5 10 C 4 20 2 33 0 33 C -2 33 -4 20 -5 10 C -8 8 -11 4 -13 -2 C -16 -10 -16 -22 -14 -30 Z',
  // Katta oziq: toʻrt doʻngli keng toj, ikki ildiz
  molar:
    'M -20 -28 C -17 -35 -12 -36 -9 -31 C -6 -36 -2 -36 0 -31 C 2 -36 6 -36 9 -31 C 12 -36 17 -35 20 -28 C 22 -20 22 -10 20 -2 C 18 4 15 7 12 9 C 12 18 11 30 8 30 C 5 30 5 20 3 14 C 2 12 -2 12 -3 14 C -5 20 -5 30 -8 30 C -11 30 -12 18 -12 9 C -15 7 -18 4 -20 -2 C -22 -10 -22 -20 -20 -28 Z',
}

/// Oziq tishlarda chaynash yuzasi chizigʻi — hajm beradi
export const GROOVES: Partial<Record<ToothType, string>> = {
  premolar: 'M -8 -26 C -3 -22 3 -22 8 -26',
  molar: 'M -13 -25 C -6 -20 6 -20 13 -25 M 0 -31 L 0 -22',
}

/// Qopqoq chekkasi tish turiga qarab — tojdan tashqariga chiqib ketmasin
export const MARGIN_X: Record<ToothType, number> = {
  incisor: 13,
  canine: 13,
  premolar: 16,
  molar: 21,
}

export interface ArchConfig {
  height: number
  top: number
  bottom: number
  lift: number
  tilt: number
  spread: number
  scale: number
  middle: number
  maxWidth: number
}

/// Doimiy va sut tishlari ravoqlarining oʻlchamlari
export const PERMANENT_ARCH: ArchConfig = {
  height: 516,
  top: 162,
  bottom: 344,
  lift: 100,
  tilt: 52,
  spread: 1,
  scale: 1,
  middle: 262,
  maxWidth: 820,
}

export const PRIMARY_ARCH: ArchConfig = {
  height: 400,
  top: 128,
  bottom: 270,
  lift: 58,
  tilt: 40,
  spread: 0.72,
  scale: 0.84,
  middle: 199,
  maxWidth: 640,
}
