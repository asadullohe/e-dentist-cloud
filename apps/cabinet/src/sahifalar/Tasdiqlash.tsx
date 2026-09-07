import { KABINET } from '@e-dentist/shared'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiXato, api } from '../lib/api'

type Holat = 'kutilmoqda' | 'tayyor' | 'xato'

export function Tasdiqlash() {
  const [params] = useSearchParams()
  const [holat, setHolat] = useState<Holat>('kutilmoqda')
  const [xato, setXato] = useState('')
  const kalit = params.get('kalit') ?? ''

  // StrictMode effektni ikki marta chaqiradi. Server takrorni bardosh qiladi,
  // lekin ortiqcha soʻrov yuborishning maʼnosi yoʻq
  const yuborilgan = useRef(false)

  useEffect(() => {
    if (yuborilgan.current) return
    yuborilgan.current = true
    let bekor = false
    api
      .tasdiqla(kalit)
      .then(() => !bekor && setHolat('tayyor'))
      .catch((x: unknown) => {
        if (bekor) return
        setXato(x instanceof ApiXato ? x.message : KABINET.aloqa_yoq)
        setHolat('xato')
      })
    return () => {
      bekor = true
    }
  }, [kalit])

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-logo">{KABINET.brend}</div>
        {holat === 'kutilmoqda' && (
          <p className="muted" style={{ marginTop: 18 }}>
            {KABINET.tasdiqlanmoqda}
          </p>
        )}
        {holat === 'tayyor' && (
          <>
            <div style={{ fontSize: 40, marginTop: 12 }}>✅</div>
            <h2 style={{ marginTop: 10 }}>{KABINET.tasdiqlandi}</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              {KABINET.tasdiqlandi_izoh}
            </p>
          </>
        )}
        {holat === 'xato' && (
          <>
            <div style={{ fontSize: 40, marginTop: 12 }}>⚠️</div>
            <div className="field-err" style={{ marginTop: 10 }}>
              {xato}
            </div>
          </>
        )}
        <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
          <Link to="/kirish">{KABINET.kirish}</Link>
        </p>
      </div>
    </div>
  )
}
