import { useEffect, useState } from 'react'

/// Media soʻrovi natijasi. Faqat CSS bilan hal boʻlmaydigan joyda — tuzilma
/// oʻzgarganda (masalan, jadval ustunlari telefonda boshqacha boʻlinadi)
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    // Hook ulangunicha kenglik oʻzgargan boʻlishi mumkin
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}
