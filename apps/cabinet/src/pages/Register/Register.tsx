import { formatUzPhone, UI_TEXT } from '@e-dentist/shared'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../app/layouts/AuthLayout'
import { useRegister } from '../../features/auth'
import { fieldErrors, formError } from '../../shared/api'
import { Field } from '../../shared/ui'
import styles from './Register.module.scss'

export function Register() {
  const { mutate, isPending, isSuccess, error } = useRegister()
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fields = fieldErrors(error)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutate({ clinicName, phone: phone || undefined, fullName, email, password })
  }

  if (isSuccess) {
    return (
      <AuthLayout centered footer={<Link to="/login">{UI_TEXT.login}</Link>}>
        <div className={styles.sentIcon}>📬</div>
        <h2 className={styles.sentTitle}>{UI_TEXT.mail_sent}</h2>
        <p className={styles.sentHint}>{UI_TEXT.mail_sent_hint}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      footer={
        <>
          {UI_TEXT.have_account} <Link to="/login">{UI_TEXT.login}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Field label={UI_TEXT.clinic_name} error={fields.clinicName}>
          <input
            className="input"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />
        </Field>
        <Field label={UI_TEXT.phone} error={fields.phone}>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(formatUzPhone(e.target.value))}
            placeholder="+998 90 123 45 67"
            inputMode="tel"
          />
        </Field>
        <Field label={UI_TEXT.full_name} error={fields.fullName}>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label={UI_TEXT.email} error={fields.email}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label={UI_TEXT.password} error={fields.password}>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {formError(error) && <div className={styles.error}>{formError(error)}</div>}
        <button className={`btn ${styles.submit}`} type="submit" disabled={isPending}>
          {isPending ? UI_TEXT.sending : UI_TEXT.register}
        </button>
      </form>
    </AuthLayout>
  )
}
