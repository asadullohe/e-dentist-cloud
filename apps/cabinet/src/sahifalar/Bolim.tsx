// Vaqtinchalik: boʻlimlar 2-bosqichdan boshlab toʻldiriladi.
// Menyu va marshrutlar hozirdan toʻgʻri ishlashi uchun turibdi.

import { KABINET } from '@e-dentist/shared'
import { Empty } from '../lib/ui'

export function Bolim({ nom, ico }: { nom: string; ico: string }) {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{nom}</h1>
      </div>
      <div className="card">
        <Empty icon={ico} text={KABINET.bolim_tayyorlanmoqda} />
      </div>
    </>
  )
}
