import { KABINET } from '@e-dentist/shared'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiXato } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Field } from '../lib/ui'

export function Kirish() {
  const { kir } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [parol, setParol] = useState('')
  const [xato, setXato] = useState('')
  const [maydonlar, setMaydonlar] = useState<Record<string, string>>({})
  const [yubormoqda, setYubormoqda] = useState(false)

  async function yubor(e: FormEvent) {
    e.preventDefault()
    setXato('')
    setMaydonlar({})
    setYubormoqda(true)
    try {
      await kir(email, parol)
      navigate('/', { replace: true })
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

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-logo">{KABINET.brend}</div>
        <form onSubmit={yubor} style={{ marginTop: 18, textAlign: 'left' }}>
          <Field label={KABINET.pochta} error={maydonlar.email}>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              // biome-ignore lint/a11y/noAutofocus: kirish oynasida birinchi maydon
              autoFocus
            />
          </Field>
          <Field label={KABINET.parol} error={maydonlar.password}>
            <input
              className="input"
              type="password"
              value={parol}
              onChange={(e) => setParol(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          {xato && <div className="field-err">{xato}</div>}
          <button
            className="btn"
            type="submit"
            disabled={yubormoqda}
            style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
          >
            {yubormoqda ? KABINET.yuklanmoqda : KABINET.kirish}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          {KABINET.hisobingiz_yoqmi} <Link to="/royxat">{KABINET.royxatdan_otish}</Link>
        </p>
      </div>
    </div>
  )
}
