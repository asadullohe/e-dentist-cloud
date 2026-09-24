/// Ismning bosh harflari — surat oʻrnida (koʻpi bilan ikkita)
export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
