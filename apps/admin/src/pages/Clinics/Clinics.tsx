import { ADMIN_UI } from '@e-dentist/shared'
import { Card } from '@/shared/ui'

/// Roʻyxat va kartochka 5.3 da toʻldiriladi
export function Clinics() {
  return (
    <>
      <h1 className="font-display mb-4 text-2xl font-bold tracking-tight">{ADMIN_UI.clinics}</h1>
      <Card className="p-6 text-center">
        <p className="text-muted-foreground text-sm">{ADMIN_UI.soon}</p>
      </Card>
    </>
  )
}
