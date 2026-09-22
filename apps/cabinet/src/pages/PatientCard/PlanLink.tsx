import { PLAN_UI } from '@e-dentist/shared'
import { CheckIcon, CopyIcon, QrCodeIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Button, Card, Input } from '@/shared/ui'

/// Bemorga beriladigan havola: nusxalanadi yoki QR orqali telefonga
/// koʻchiriladi. QR shu yerda yasaladi — tashqi xizmat yoʻq, kod tashqariga
/// chiqmaydi (navbat varagʻidagi kabi)
export function PlanLink({ publicCode }: { publicCode: string }) {
  const address = `${window.location.origin}/r/${publicCode}`
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Brauzer ruxsat bermadi — havola maydonda turibdi, qoʻlda olinadi
      setCopied(false)
    }
  }

  return (
    <Card className="mt-4 gap-2 p-3">
      <div className="text-muted-foreground text-xs">{PLAN_UI.link}</div>
      <div className="flex gap-2">
        <Input readOnly value={address} className="font-mono text-xs" />
        <Button variant="outline" size="icon" onClick={copy} aria-label={PLAN_UI.link_copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQrOpen((open) => !open)}
          aria-label="QR"
        >
          <QrCodeIcon />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {copied ? PLAN_UI.link_copied : PLAN_UI.link_hint}
      </p>

      {/* Oq fon qotirilgan: qorongʻi rejimda ham skanerlanadi */}
      {qrOpen && (
        <div className="mt-1 w-fit rounded-lg border bg-white p-3">
          <QRCodeSVG value={address} size={144} level="M" marginSize={0} />
        </div>
      )}
    </Card>
  )
}
