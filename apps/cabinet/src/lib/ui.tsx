// Oflayn ilovadagi components/ui.jsx dan koʻchirildi.
// Kabinet va boshqaruv paneli ikkalasiga ham kerak boʻlganda packages/ui ga
// koʻchadi (bosqich 5.2).

import { cloneElement, type ReactElement, useId } from 'react'

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | undefined
  children: ReactElement<{ id?: string }>
}) {
  // Oflayn versiyada yorliq maydonga bogʻlanmagan edi: ekran oʻqiydigan
  // dastur uni oʻqimaydi va yorliqni bosganda kursor maydonga tushmaydi
  const id = useId()

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
      {error && <div className="field-err">{error}</div>}
    </div>
  )
}

export function Empty({ icon = '🗂', text }: { icon?: string; text: string }) {
  return (
    <div className="empty">
      <div style={{ fontSize: 34, marginBottom: 8 }}>{icon}</div>
      <div>{text}</div>
    </div>
  )
}
