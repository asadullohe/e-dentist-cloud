// Vaqtinchalik: boʻlimlar 2-bosqichdan boshlab toʻldiriladi.
// Menyu va marshrutlar hozirdan toʻgʻri ishlashi uchun turibdi.

import { UI_TEXT } from '@e-dentist/shared'
import { Empty } from '../../shared/ui'
import styles from './Placeholder.module.scss'

interface PlaceholderProps {
  title: string
  icon: string
}

export function Placeholder({ title, icon }: PlaceholderProps) {
  return (
    <>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.card}>
        <Empty icon={icon} text={UI_TEXT.section_soon} />
      </div>
    </>
  )
}
