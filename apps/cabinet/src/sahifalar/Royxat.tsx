import { formatUzPhone, KABINET } from '@e-dentist/shared'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiXato, api } from '../lib/api'
import { Field } from '../lib/ui'

export function Royxat() {
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [xato, setXato] = useState('')
  const [maydonlar, setMaydonlar] = useState<Record<string, string>>({})
  const [yubormoqda, setYubormoqda] = useState(false)
  const [yuborildi, setYuborildi] = useState(false)

  async function yubor(e: FormEvent) {
    e.preventDefault()
    setXato('')
    setMaydonlar({})
    setYubormoqda(true)
    try {
      await api.royxat({ clinicName, phone: phone || undefined, fullName, email, password })
      setYuborildi(true)
    } catch (x) {
      if (x instanceof ApiXato) {
        setXato(x.fields ? '' : x.message)
        setMaydonlar(x.fields ?? {})
      } else {
        setXato(KABINET.aloqa_yoq)
      }
    } finally {
      setYubormoqda(false)
    }
  }

  if (yuborildi) {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <div style={{ fontSize: 40 }}>📬</div>
          <h2 style={{ marginTop: 10 }}>{KABINET.xat_yuborildi}</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            {KABINET.xat_yuborildi_izoh}
          </p>
          <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
            <Link to="/kirish">{KABINET.kirish}</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lock-screen">
      <div className="lock-card" style={{ width: 'min(420px, 92vw)' }}>
        <div className="lock-logo">{KABINET.brend}</div>
        <form onSubmit={yubor} style={{ marginTop: 18, textAlign: 'left' }}>
          <Field label={KABINET.klinika_nomi} error={maydonlar.clinicName}>
            <input
              className="input"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              // biome-ignore lint/a11y/noAutofocus: formaning birinchi maydoni
              autoFocus
            />
          </Field>
          <Field label={KABINET.telefon} error={maydonlar.phone}>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
            />
          </Field>
          <Field label={KABINET.fio} error={maydonlar.fullName}>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label={KABINET.pochta} error={maydonlar.email}>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label={KABINET.parol} error={maydonlar.password}>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          {xato && <div className="field-err">{xato}</div>}
          <button
            className="btn"
            type="submit"
            disabled={yubormoqda}
            style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
          >
            {yubormoqda ? KABINET.yuborilmoqda : KABINET.royxatdan_otish}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          {KABINET.hisobingiz_bormi} <Link to="/kirish">{KABINET.kirish}</Link>
        </p>
      </div>
    </div>
  )
}
